import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

type SuggestedQuestionsProps = {
    questions: string[];
    onSelectQuestion: (question: string) => void;
    disabled?: boolean;
};

export function SuggestedQuestions({
    questions,
    onSelectQuestion,
    disabled = false,
}: SuggestedQuestionsProps) {
    return (
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-t border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className="text-sm font-semibold text-slate-200">Suggested Questions</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {questions.map((question, idx) => (
                    <Button
                        key={idx}
                        onClick={() => onSelectQuestion(question)}
                        disabled={disabled}
                        variant="outline"
                        className="justify-start text-left h-auto py-3 px-4 text-sm text-slate-300 hover:text-white hover:border-blue-500 hover:bg-blue-500/10"
                    >
                        {question}
                    </Button>
                ))}
            </div>
        </div>
    );
}