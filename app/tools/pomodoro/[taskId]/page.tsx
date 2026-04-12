import { PomodoroTimer } from "@/components/pomodoro/PomodoroTimer";

export default async function PomodoroPage(props: { params: Promise<{ taskId: string }> }): Promise<JSX.Element> {
  const { taskId } = await props.params;
  return <PomodoroTimer taskId={taskId} />;
}
