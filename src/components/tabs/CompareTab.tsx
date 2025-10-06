import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function CompareTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Сравнение файлов</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Функция сравнения файлов</p>
      </CardContent>
    </Card>
  );
}
