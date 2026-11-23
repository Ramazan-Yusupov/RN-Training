import { useDeferredValue, useState, type ReactNode } from "react";
import { Plus, UserRound } from "lucide-react-native";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import ReorderableList, { reorderItems, useReorderableDrag, type ReorderableListReorderEvent } from "react-native-reorderable-list";
import { useSharedValue, type SharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { getGroupTasks, usePlanStore, usePlanUiStore, type PlanTask } from "@/entities/plan";
import { getProfileLevel, totalXp, useProgressStore } from "@/entities/progress";
import { AddContentSheet } from "@/features/manage-plan";
import { AppText, ProgressBar, SwipeToDelete } from "@/shared/ui";
import { PlanWidgetCard } from "@/widgets/plan-widget";

import { CompactFocusTimer } from "./CompactFocusTimer";
import { DaySwitcher } from "./DaySwitcher";
import { TaskRow } from "./TaskRow";

function ReorderHandle() {
  const drag = useReorderableDrag();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Удерживайте, чтобы изменить порядок"
      onLongPress={drag}
      delayLongPress={180}
      className="h-10 w-7 items-center justify-center"
    >
      <AppText className="text-slate-500" weight="bold" style={{ fontSize: 16 }}>⠿</AppText>
    </Pressable>
  );
}

function TaskReorderHandle() {
  const drag = useReorderableDrag();
  return (
    <Pressable onLongPress={drag} delayLongPress={180} className="h-10 w-7 items-center justify-center">
      <AppText className="text-slate-500" weight="bold" style={{ fontSize: 15 }}>⠿</AppText>
    </Pressable>
  );
}

function ReorderAwareSwipe({ children, onDelete, enabled }: { children: ReactNode; onDelete: () => void; enabled: SharedValue<boolean> }) {
  return <SwipeToDelete enabled={enabled} onDelete={onDelete}>{children}</SwipeToDelete>;
}

function GroupTaskList({ dayNumber, groupId, tasks, completedSwipeEnabled, onDelete, onEdit, onDragStart, onDragEnd }: {
  dayNumber: number;
  groupId: string;
  tasks: PlanTask[];
  completedSwipeEnabled: SharedValue<boolean>;
  onDelete: (task: PlanTask) => void;
  onEdit: (task: PlanTask) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const setGroupTaskOrder = usePlanStore((state) => state.setGroupTaskOrder);
  if (tasks.length === 0) return null;
  return (
    <ReorderableList
      data={tasks}
      keyExtractor={(task) => task.id}
      scrollEnabled={false}
      style={{ height: tasks.length * 72 }}
      onReorder={({ from, to }) => {
        const ordered = reorderItems(tasks, from, to);
        setGroupTaskOrder(dayNumber, groupId, ordered.map((task) => task.id));
      }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      cellAnimations={{ opacity: 1 }}
      renderItem={({ item: task }) => (
        <View style={{ height: 72, paddingBottom: 8 }}>
          <ReorderAwareSwipe enabled={completedSwipeEnabled} onDelete={() => onDelete(task)}>
            <TaskRow task={task} dragHandle={<TaskReorderHandle />} onLongPress={() => onEdit(task)} />
          </ReorderAwareSwipe>
        </View>
      )}
    />
  );
}

export function TodayPage() {
  const swipeEnabled = useSharedValue(true);
  const [addOpen, setAddOpen] = useState(false);
  const [initialGroupId, setInitialGroupId] = useState<string | null | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<(typeof day.tasks)[number] | null>(null);
  const [editingGroup, setEditingGroup] = useState<(typeof day.groups)[number] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<null | { kind: "task" | "group" | "widget"; id: string; title: string; hasSeries: boolean }>(null);
  const selectedDay = usePlanUiStore((state) => state.selectedDay);
  const displayedDayNumber = useDeferredValue(selectedDay);
  const template = usePlanStore((state) => state.template);
  const dayOverrides = usePlanStore((state) => state.dayOverrides);
  const day = dayOverrides[String(displayedDayNumber)] ?? template.days.find((item) => item.day === displayedDayNumber) ?? template.days[0]!;
  const completed = useProgressStore((state) => state.completed);
  const deleteTask = usePlanStore((state) => state.deleteTask);
  const deleteGroup = usePlanStore((state) => state.deleteGroup);
  const deleteWidget = usePlanStore((state) => state.deleteWidget);
  const setContentOrder = usePlanStore((state) => state.setContentOrder);
  const microBreaks = useProgressStore((state) => state.microBreaks);
  const requiredTasks = day.tasks.filter((task) => task.required);
  const completedRequired = requiredTasks.filter((task) => completed[task.id]).length;
  const days = template.days.map((item) => dayOverrides[String(item.day)] ?? item);
  const allXp = totalXp(days, { completed, microBreaks });
  const level = getProfileLevel(allXp);
  const groupById = new Map(day.groups.map((group) => [group.id, group]));
  const standaloneById = new Map(day.tasks.filter((task) => task.groupId === null).map((task) => [task.id, task]));
  const widgetById = new Map(day.widgets.filter((widget) => widget.enabled).map((widget) => [widget.id, widget]));
  const contentCards: (
    | { id: string; kind: "group"; group: (typeof day.groups)[number] }
    | { id: string; kind: "task"; task: (typeof day.tasks)[number] }
    | { id: string; kind: "widget"; widget: (typeof day.widgets)[number] }
  )[] = [];
  const seen = new Set<string>();
  for (const item of day.contentOrder ?? []) {
    const key = `${item.type}:${item.id}`;
    if (seen.has(key)) continue;
    if (item.type === "group" && groupById.has(item.id)) contentCards.push({ id: `group:${item.id}`, kind: "group", group: groupById.get(item.id)! });
    if (item.type === "task" && standaloneById.has(item.id)) contentCards.push({ id: `task:${item.id}`, kind: "task", task: standaloneById.get(item.id)! });
    if (item.type === "widget" && widgetById.has(item.id)) contentCards.push({ id: `widget:${item.id}`, kind: "widget", widget: widgetById.get(item.id)! });
    seen.add(key);
  }
  day.groups.forEach((group) => { if (!seen.has(`group:${group.id}`)) contentCards.push({ id: `group:${group.id}`, kind: "group", group }); });
  standaloneById.forEach((task) => { if (!seen.has(`task:${task.id}`)) contentCards.push({ id: `task:${task.id}`, kind: "task", task }); });
  widgetById.forEach((widget) => { if (!seen.has(`widget:${widget.id}`)) contentCards.push({ id: `widget:${widget.id}`, kind: "widget", widget }); });
  type ContentCard = (typeof contentCards)[number];
  const saveContentPositions = ({ from, to }: ReorderableListReorderEvent) => {
    const ordered = reorderItems(contentCards, from, to);
    const order = ordered.map((entry) => entry.kind === "group" ? { type: "group" as const, id: entry.group.id } : entry.kind === "task" ? { type: "task" as const, id: entry.task.id } : { type: "widget" as const, id: entry.widget.id });
    setContentOrder(displayedDayNumber, order);
  };
  const requestTaskDelete = (task: (typeof day.tasks)[number]) => {
    const key = task.originId ?? task.id;
    const count = days.reduce((sum, item) => sum + item.tasks.filter((candidate) => (candidate.originId ?? candidate.id) === key).length, 0);
    setDeleteTarget({ kind: "task", id: task.id, title: task.title, hasSeries: count > 1 });
  };
  const requestGroupDelete = (group: (typeof day.groups)[number]) => {
    const count = days.reduce((sum, item) => sum + item.groups.filter((candidate) => candidate.id === group.id).length, 0);
    setDeleteTarget({ kind: "group", id: group.id, title: group.title, hasSeries: count > 1 });
  };
  const requestWidgetDelete = (widget: (typeof day.widgets)[number]) => {
    const key = widget.seriesId ?? widget.id;
    const count = days.reduce((sum, item) => sum + item.widgets.filter((candidate) => (candidate.seriesId ?? candidate.id) === key).length, 0);
    setDeleteTarget({ kind: "widget", id: widget.id, title: "виджет", hasSeries: count > 1 });
  };
  const confirmDelete = (scope: "day" | "all") => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "task") deleteTask(displayedDayNumber, deleteTarget.id, scope);
    if (deleteTarget.kind === "group") deleteGroup(displayedDayNumber, deleteTarget.id, scope);
    if (deleteTarget.kind === "widget") deleteWidget(displayedDayNumber, deleteTarget.id, scope);
    setDeleteTarget(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0a" }} edges={["top"]}>
      <View className="mb-3 flex-row items-center justify-between gap-3 border-b border-white/10 px-4 pb-3 pt-2">
        <View className="flex-row items-center gap-3">
          <AppText weight="bold" style={{ fontSize: 17 }}>Планер</AppText>
          <View className="h-5 w-px bg-white/10" />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-center justify-between gap-2">
            <AppText className="text-gray-400" weight="semibold" style={{ fontSize: 9 }} numberOfLines={1}>
              {level.rank.title} · {level.number} ур.
            </AppText>
            <AppText className="text-gray-500" style={{ fontSize: 8 }}>{level.progress}/100 XP</AppText>
          </View>
          <ProgressBar value={level.progress} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Открыть профиль"
          className="h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-slate-200"
        >
          <UserRound color="#334155" size={17} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View className="gap-3 pb-3">
        <View className="gap-2 px-4">
          <View className="flex-row items-center justify-between">
            <AppText weight="medium" style={{ fontSize: 12 }}>Обязательные задачи</AppText>
            <AppText className="text-blue-300" style={{ fontSize: 11 }}>
              {completedRequired} из {requiredTasks.length}
            </AppText>
          </View>
          <ProgressBar value={completedRequired} max={requiredTasks.length || 1} />
        </View>

        <DaySwitcher />
        <CompactFocusTimer />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Добавить карточку, виджет или задачу"
          onPress={() => {
            setInitialGroupId(undefined);
            setAddOpen(true);
          }}
          className="mx-4 min-h-12 flex-row items-center justify-center gap-2 rounded-xl border-2 border-white"
        >
          <Plus color="#ffffff" size={18} strokeWidth={2.5} />
          <AppText weight="bold" style={{ fontSize: 12 }}>Добавить карточку, виджет, задачу</AppText>
        </Pressable>
      </View>

      <View className="h-px bg-white/10" />
      <ReorderableList
        data={contentCards}
        keyExtractor={(entry: ContentCard) => entry.id}
        style={{ flex: 1, minHeight: 160, backgroundColor: "#0a0a0a" }}
        onReorder={saveContentPositions}
        cellAnimations={{ opacity: 1 }}
        onDragStart={() => {
          "worklet";
          swipeEnabled.value = false;
        }}
        onDragEnd={() => {
          "worklet";
          swipeEnabled.value = true;
        }}
        autoscrollThreshold={0.15}
        animationDuration={180}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 24,
          flexGrow: contentCards.length === 0 ? 1 : undefined,
        }}
        renderItem={({ item: entry }) => {
          const handle = <ReorderHandle />;
          if (entry.kind === "widget") {
            return <View style={{ paddingBottom: 16 }}><ReorderAwareSwipe enabled={swipeEnabled} onDelete={() => requestWidgetDelete(entry.widget)}><PlanWidgetCard day={day} days={days} widget={entry.widget} dragHandle={handle} /></ReorderAwareSwipe></View>;
          }
          if (entry.kind === "task") {
            return (
              <View style={{ paddingBottom: 16 }}>
              <ReorderAwareSwipe enabled={swipeEnabled} onDelete={() => requestTaskDelete(entry.task)}>
              <View
                style={{ borderStyle: "dashed" }}
                className="rounded-2xl border-2 border-slate-700 bg-[#0a0a0a] px-3 py-1"
              >
                <TaskRow task={entry.task} standalone dragHandle={handle} onLongPress={() => { setEditingTask(entry.task); setEditingGroup(null); setAddOpen(true); }} />
              </View>
              </ReorderAwareSwipe>
              </View>
            );
          }

          const { group } = entry;
          const tasks = getGroupTasks(day.tasks, group.id);
          return (
            <View style={{ paddingBottom: 16 }}>
            <ReorderAwareSwipe enabled={swipeEnabled} onDelete={() => requestGroupDelete(group)}>
            <View className="gap-2 rounded-2xl border-2 border-slate-800 bg-[#0a0a0a] p-4">
              <Pressable onLongPress={() => { setEditingGroup(group); setEditingTask(null); setAddOpen(true); }} delayLongPress={450} className="flex-row items-center gap-3">
                {handle}
                <AppText className="min-w-0 flex-1" weight="bold" style={{ fontSize: 15 }}>{group.title}</AppText>
                <AppText className="text-gray-500" style={{ fontSize: 10 }}>
                  {tasks.filter((task) => completed[task.id]).length}/{tasks.length}
                </AppText>
              </Pressable>
              <GroupTaskList
                dayNumber={displayedDayNumber}
                groupId={group.id}
                tasks={tasks}
                completedSwipeEnabled={swipeEnabled}
                onDelete={requestTaskDelete}
                onEdit={(task) => { setEditingTask(task); setEditingGroup(null); setAddOpen(true); }}
                onDragStart={() => {
                  "worklet";
                  swipeEnabled.value = false;
                }}
                onDragEnd={() => {
                  "worklet";
                  swipeEnabled.value = true;
                }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Добавить задачу в группу ${group.title}`}
                onPress={() => {
                  setInitialGroupId(group.id);
                  setAddOpen(true);
                }}
                className="min-h-10 flex-row items-center justify-center gap-1.5"
              >
                <Plus color="#ffffff" size={16} strokeWidth={2.5} />
                <AppText weight="bold" style={{ fontSize: 11 }}>Добавить задачу ({tasks.length}/10)</AppText>
              </Pressable>
            </View>
            </ReorderAwareSwipe>
            </View>
          );
        }}
      />
      {addOpen ? (
        <AddContentSheet
          day={displayedDayNumber}
          groups={day.groups}
          initialGroupId={initialGroupId}
          editingTask={editingTask}
          editingGroup={editingGroup}
          open
          onClose={() => { setAddOpen(false); setEditingTask(null); setEditingGroup(null); }}
        />
      ) : null}
      <Modal visible={Boolean(deleteTarget)} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <View style={styles.deleteOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDeleteTarget(null)} />
          <View className="mx-4 gap-3 rounded-3xl border border-red-500/30 bg-[#0a0a0a] p-5">
            <AppText weight="bold" style={{ fontSize: 17 }}>Удалить «{deleteTarget?.title}»?</AppText>
            {deleteTarget?.kind === "group" ? <AppText className="text-amber-400" style={{ fontSize: 10 }}>Задачи внутри этой группы тоже будут удалены.</AppText> : null}
            <Pressable onPress={() => confirmDelete("day")} className="min-h-12 items-center justify-center rounded-xl bg-red-600"><AppText weight="bold" style={{ fontSize: 11 }}>Удалить из этого дня</AppText></Pressable>
            {deleteTarget?.hasSeries ? <Pressable onPress={() => confirmDelete("all")} className="min-h-12 items-center justify-center rounded-xl border border-red-500"><AppText className="text-red-400" weight="bold" style={{ fontSize: 11 }}>Удалить из всех дней</AppText></Pressable> : null}
            <Pressable onPress={() => setDeleteTarget(null)} className="min-h-11 items-center justify-center"><AppText className="text-gray-400" style={{ fontSize: 11 }}>Отмена</AppText></Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ deleteOverlay: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.86)" } });
