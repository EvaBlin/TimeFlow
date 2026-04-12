import { TimeboxingTimer } from "@/components/timeboxing/TimeboxingTimer";

export default async function TimeboxingPage(props: { params: Promise<{ taskId: string }> }): Promise<JSX.Element> {
  const { taskId } = await props.params;
  return <TimeboxingTimer taskId={taskId} />;
}
