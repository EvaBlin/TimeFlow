import { PomodoroTimer } from "@/components/pomodoro/PomodoroTimer";

export default function PomodoroPage(props: { params: { taskId: string } }): JSX.Element {
  return <PomodoroTimer taskId={props.params.taskId} />;
}

