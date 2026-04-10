"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SurveyAnswerOption = {
  id: string;
  label: string;
};

type SurveyQuestion = {
  id: string;
  text: string;
  answers: SurveyAnswerOption[];
};

export default function SurveyPage(): JSX.Element {
  const router = useRouter();
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/v1/survey/questions", { method: "GET" });
        if (!res.ok) throw new Error("Не удалось загрузить вопросы");
        const data = (await res.json()) as { items: SurveyQuestion[] };
        setQuestions(data.items ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    };

    void loadQuestions();
  }, []);

  const current = questions[index];
  const canGoNext = current ? Boolean(answers[current.id]) : false;
  const isLast = index === questions.length - 1;
  const progress = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round(((index + 1) / questions.length) * 100);
  }, [index, questions.length]);

  const onSubmit = async () => {
    if (!questions.length) return;
    const payload = questions.map((q) => ({
      question_id: q.id,
      answer_id: answers[q.id]
    }));

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Ошибка сохранения ответов");
      }

      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отправки");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-3 md:p-6">
      <div className="mx-auto w-full max-w-6xl rounded-md border border-gray-300 bg-[#f7f7f7]">
        <div className="border-b border-gray-300 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="h-8 w-20 rounded bg-gray-200" />
            <div className="text-sm text-gray-600">
              {questions.length ? `Вопрос ${index + 1} из ${questions.length}` : "Опрос"}
            </div>
          </div>
          <div className="mt-4 h-1 w-full overflow-hidden rounded bg-gray-200">
            <div className="h-1 bg-gray-700" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <section className="px-6 py-12">
          {loading ? (
            <p className="text-center text-sm text-gray-500">Загрузка вопросов...</p>
          ) : error ? (
            <p className="text-center text-sm text-rose-600">{error}</p>
          ) : !current ? (
            <p className="text-center text-sm text-gray-500">Нет активных вопросов.</p>
          ) : (
            <div className="mx-auto max-w-md">
              <h1 className="text-center text-2xl font-semibold text-gray-800">{current.text}</h1>
              <div className="mt-10 space-y-3">
                {current.answers.map((option) => {
                  const checked = answers[current.id] === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center gap-3 rounded border bg-white px-4 py-3 ${
                        checked ? "border-gray-700" : "border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${current.id}`}
                        checked={checked}
                        onChange={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [current.id]: option.id
                          }))
                        }
                      />
                      <span className="text-sm text-gray-800">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <div className="flex items-center justify-between border-t border-gray-300 px-6 py-3">
          <button
            type="button"
            onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
            disabled={index === 0 || loading || submitting}
            className="rounded border border-gray-300 bg-white px-5 py-2 text-sm text-gray-700 disabled:opacity-50"
          >
            Назад
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={() => void onSubmit()}
              disabled={!canGoNext || loading || submitting}
              className="rounded bg-gray-700 px-5 py-2 text-sm text-white disabled:opacity-50"
            >
              {submitting ? "Сохранение..." : "Завершить"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={!canGoNext || loading || submitting}
              className="rounded bg-gray-700 px-5 py-2 text-sm text-white disabled:opacity-50"
            >
              Далее
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

