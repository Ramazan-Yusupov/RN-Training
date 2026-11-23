import { useState } from "react";
import * as Linking from "expo-linking";
import { Eye, EyeOff, X } from "lucide-react-native";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";

import { supabase } from "@/shared/config/supabase";
import { theme } from "@/shared/config/theme";
import { AppText } from "@/shared/ui";

export function AuthSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    if (!supabase || busy) return;
    setBusy(true); setError(""); setMessage("");
    const address = email.trim();
    try {
      if (register) {
        const { data, error: authError } = await supabase.auth.signUp({
          email: address,
          password,
          options: { emailRedirectTo: Linking.createURL("/auth/callback") },
        });
        if (authError) throw authError;
        if (!data.session) setMessage("Проверь почту и подтверди регистрацию.");
        else onClose();
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: address, password });
        if (authError) throw authError;
        onClose();
      }
    } catch (reason) {
      const code = reason && typeof reason === "object" && "code" in reason ? String(reason.code) : "";
      setError(code === "invalid_credentials" ? "Неверная почта или пароль." : code === "email_not_confirmed" ? "Сначала подтверди почту." : "Не удалось выполнить запрос. Попробуй ещё раз.");
    } finally { setBusy(false); }
  };

  return <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.overlay}><Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet} className="gap-4">
          <View className="flex-row items-center justify-between"><AppText weight="bold" style={{ fontSize: 18 }}>{register ? "Регистрация" : "Вход"}</AppText><Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-xl border border-white/10"><X color="#fff" size={20} /></Pressable></View>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="Электронная почта" placeholderTextColor="#6b7280" style={styles.input} />
          <View><TextInput value={password} onChangeText={setPassword} secureTextEntry={!visible} autoCapitalize="none" placeholder="Пароль" placeholderTextColor="#6b7280" style={[styles.input, { paddingRight: 50 }]} /><Pressable onPress={() => setVisible((value) => !value)} className="absolute right-1 top-1 h-10 w-10 items-center justify-center">{visible ? <EyeOff color="#94a3b8" size={18} /> : <Eye color="#94a3b8" size={18} />}</Pressable></View>
          {message ? <AppText className="text-green-400" style={{ fontSize: 10, textAlign: "center" }}>{message}</AppText> : null}
          {error ? <AppText className="text-red-400" style={{ fontSize: 10, textAlign: "center" }}>{error}</AppText> : null}
          <Pressable disabled={busy || !email.trim() || password.length < 6} onPress={submit} className="min-h-12 items-center justify-center rounded-xl bg-blue-500 disabled:opacity-40"><AppText weight="bold" style={{ fontSize: 12 }}>{busy ? "Подожди…" : register ? "Создать аккаунт" : "Войти"}</AppText></Pressable>
          <Pressable disabled={busy} onPress={() => { setRegister((value) => !value); setError(""); setMessage(""); }} className="min-h-10 items-center justify-center"><AppText className="text-blue-400" style={{ fontSize: 10 }}>{register ? "Уже есть аккаунт" : "Создать аккаунт"}</AppText></Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({ overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.86)" }, sheet: { padding: 20, paddingBottom: 28, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: "#334155", backgroundColor: "#0a0a0a" }, input: { minHeight: 48, borderWidth: 1, borderColor: "#334155", borderRadius: 12, paddingHorizontal: 14, color: "#fff", backgroundColor: "#09090b", fontFamily: theme.fonts.regular, fontSize: 12 } });
