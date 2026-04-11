import { TimeboxingTimer } from "@/components/timeboxing/TimeboxingTimer";

export default function TimeboxingPage(props: { params: { taskId: string } }): JSX.Element {
  return <TimeboxingTimer taskId={props.params.taskId} />;
}

