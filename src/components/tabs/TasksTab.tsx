import { Task } from "@/types/crm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface TasksTabProps {
  tasks: Task[];
}

export function TasksTab({ tasks }: TasksTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Задачи — счётчики</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Загружено задач: {tasks.length}</p>
      </CardContent>
    </Card>
  );
}
