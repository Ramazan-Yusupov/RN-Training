import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePlanStore } from "@/entities/plan";
import { useProgressStore } from "@/entities/progress";
import { useMicroBreakStore } from "@/entities/micro-break";
import { useFocusTimerStore } from "@/features/focus-timer";
import { supabase } from "@/shared/config/supabase";
import { AppText } from "@/shared/ui";

import { useAccount } from "../model/useAccount";
import {
  createFreshAccountSnapshot,
  isAccountSnapshot,
  restoreAccountSnapshot,
  takeAccountSnapshot,
  type AccountSnapshot,
} from "../model/accountSnapshot";

type WorkspaceState = "loading" | "choose" | "ready" | "error";
const memoryStorage = { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} };
const createRevision = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

function GateButton({ title, onPress, secondary = false }: { title: string; onPress: () => void; secondary?: boolean }) {
  return <Pressable onPress={onPress} className={`min-h-12 items-center justify-center rounded-xl ${secondary ? "border border-slate-600" : "bg-blue-500"}`}><AppText weight="bold" style={{ fontSize: 11 }}>{title}</AppText></Pressable>;
}

function SignedInWorkspace({ userId, children }: { userId: string; children: ReactNode }) {
  const [state, setState] = useState<WorkspaceState>("loading");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const chooseRef = useRef<(local: boolean) => void>(() => {});

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    const guest = takeAccountSnapshot();
    let active = true;
    let revision: string | null = null;
    let rewards: Record<string, string> = {};
    let writing = false;
    let dirty = false;
    let conflictRetries = 0;
    let applyingRemote = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let syncInterval: ReturnType<typeof setInterval> | undefined;
    let realtimeChannel: ReturnType<typeof client.channel> | null = null;
    const stops: (() => void)[] = [];
    const persistedStores = [usePlanStore, useProgressStore, useMicroBreakStore, useFocusTimerStore];
    const oldStorages = persistedStores.map((store) => store.persist.getOptions().storage);
    persistedStores.forEach((store) => store.persist.setOptions({ storage: memoryStorage }));

    const fail = (error: unknown) => {
      if (!active) return;
      setMessage(error instanceof Error ? error.message : "Не удалось синхронизировать план.");
      setState("error");
    };

    const save = async () => {
      if (!active || writing) { dirty = true; return; }
      writing = true;
      dirty = false;
      setMessage("Сохранение…");
      const nextRevision = createRevision();
      const payload = takeAccountSnapshot(rewards);
      const query = revision
        ? client.from("account_plans").update({ revision: nextRevision, payload }).eq("user_id", userId).eq("revision", revision).select("revision").maybeSingle()
        : client.from("account_plans").insert({ user_id: userId, revision: nextRevision, payload }).select("revision").single();
      const result = await query;
      if (!active) return;
      writing = false;
      const saveErrorMessage = result.error ? String(result.error.message) : null;
      if (result.error || !result.data) {
        if (result.error?.code === "23505" || !result.data) {
          setMessage("Синхронизация…");
          const latest = await client.from("account_plans").select("revision").eq("user_id", userId).maybeSingle();
          if (!active) return;
          if (latest.error) {
            fail(new Error(latest.error.message));
            return;
          }
          revision = latest.data?.revision ?? null;
          conflictRetries += 1;
          dirty = true;
          if (conflictRetries >= 3 && revision) {
            const forcedRevision = createRevision();
            const forced = await client.from("account_plans").update({
              revision: forcedRevision,
              payload: takeAccountSnapshot(rewards),
            }).eq("user_id", userId).select("revision").single();
            if (!active) return;
            if (forced.error) {
              fail(new Error(forced.error.message));
              return;
            }
            revision = forcedRevision;
            conflictRetries = 0;
            dirty = false;
            setMessage("");
            return;
          }
          void save();
          return;
        }
        fail(new Error(saveErrorMessage ?? "Не удалось сохранить план."));
        return;
      }
      revision = nextRevision;
      conflictRetries = 0;
      setMessage("");
      if (dirty) void save();
    };

    const scheduleSave = () => {
      if (applyingRemote) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void save(), 450);
    };
    const applyCloudRow = (row: { revision?: unknown; payload?: unknown }) => {
      if (!active || writing || dirty || typeof row.revision !== "string" || row.revision === revision || !isAccountSnapshot(row.payload)) return;
      if (timer) clearTimeout(timer);
      applyingRemote = true;
      revision = row.revision;
      rewards = row.payload.settings.rewards;
      restoreAccountSnapshot(row.payload);
      applyingRemote = false;
      setMessage("");
    };
    const ready = () => {
      [usePlanStore, useProgressStore, useMicroBreakStore, useFocusTimerStore].forEach((store) => stops.push(store.subscribe(scheduleSave)));
      realtimeChannel = client
        .channel(`account-plan:${userId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "account_plans", filter: `user_id=eq.${userId}` },
          (event) => {
            applyCloudRow(event.new as { revision?: unknown; payload?: unknown });
          },
        )
        .subscribe();
      syncInterval = setInterval(() => {
        if (!active || writing || dirty) return;
        void client.from("account_plans").select("revision,payload").eq("user_id", userId).maybeSingle().then(({ data }) => {
          if (data) applyCloudRow(data);
        });
      }, 3000);
      setState("ready");
      setMessage("");
    };

    const load = async () => {
      const { data, error } = await client.from("account_plans").select("revision,payload").eq("user_id", userId).maybeSingle();
      if (!active) return;
      if (error) throw new Error(error.message);
      if (data?.payload) {
        if (!isAccountSnapshot(data.payload)) throw new Error("Облачная копия плана повреждена или имеет неизвестный формат.");
        revision = data.revision;
        rewards = data.payload.settings.rewards;
        restoreAccountSnapshot(data.payload);
        ready();
        return;
      }
      chooseRef.current = (local) => {
        if (!active) return;
        const selected: AccountSnapshot = local ? guest : createFreshAccountSnapshot();
        restoreAccountSnapshot(selected);
        ready();
        void save();
      };
      setState("choose");
    };
    void load().catch(fail);

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      if (syncInterval) clearInterval(syncInterval);
      if (realtimeChannel) void client.removeChannel(realtimeChannel);
      stops.forEach((stop) => stop());
      restoreAccountSnapshot(guest);
      persistedStores.forEach((store, index) => store.persist.setOptions({ storage: oldStorages[index] }));
    };
  }, [retry, userId]);

  if (state === "ready") return <>{children}</>;
  return <SafeAreaView className="flex-1 bg-[#0a0a0a]" edges={["top", "bottom"]}><View className="flex-1 justify-center gap-4 p-6">
    <AppText weight="bold" style={{ fontSize: 20 }}>Аккаунт и синхронизация</AppText>
    {state === "loading" && <AppText className="text-gray-400" style={{ fontSize: 11 }}>Загружаем план из аккаунта…</AppText>}
    {state === "choose" && <><AppText className="text-gray-400" style={{ fontSize: 11 }}>В аккаунте пока нет плана. Что использовать на всех устройствах?</AppText><GateButton title="Перенести локальный план" onPress={() => chooseRef.current(true)} /><GateButton title="Создать новый план" secondary onPress={() => chooseRef.current(false)} /></>}
    {state === "error" && <><AppText className="text-red-400" style={{ fontSize: 11 }}>{message}</AppText><GateButton title="Повторить" onPress={() => setRetry((value) => value + 1)} /></>}
    {state !== "loading" && <GateButton title="Выйти в гостевой режим" secondary onPress={() => void clientSignOut()} />}
  </View></SafeAreaView>;
}

async function clientSignOut() {
  await supabase?.auth.signOut({ scope: "local" });
}

export function AccountWorkspace({ children }: { children: ReactNode }) {
  const user = useAccount();
  if (supabase && user === undefined) return <SafeAreaView className="flex-1 items-center justify-center bg-[#0a0a0a]"><AppText className="text-gray-400" style={{ fontSize: 11 }}>Проверяем аккаунт…</AppText></SafeAreaView>;
  return user ? <SignedInWorkspace userId={user.id}>{children}</SignedInWorkspace> : <>{children}</>;
}
