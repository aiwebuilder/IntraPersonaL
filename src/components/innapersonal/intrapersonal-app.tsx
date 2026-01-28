
"use client";

import { useState, useEffect, useRef, useMemo, FC, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { topics } from "@/lib/topics";
import { books } from "@/lib/books";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { generateTopicQuestions, type GenerateTopicQuestionsOutput } from "@/ai/flows/generate-topic-questions";
import { analyzeSpeechAndGenerateReport, type AnalyzeSpeechAndGenerateReportOutput } from "@/ai/flows/analyze-speech-and-generate-report";
import { sendReportEmail, type SendReportEmailInput } from "@/ai/flows/send-report-email";
import { getBookSummary } from "@/ai/flows/get-book-summary";
import { generateBookQuestions, type GenerateBookQuestionsOutput } from "@/ai/flows/generate-book-questions";
import { analyzeBookAnswers, type AnalyzeBookAnswersOutput } from "@/ai/flows/analyze-book-answers";
import TextareaAutosize from 'react-textarea-autosize';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mic, MicOff, RotateCw, Sparkles, Send, AlertTriangle, Mail, ChevronRight, Wand, Book, MessageSquare, Timer } from "lucide-react";
import { BarChart as BarChartComponent, PieChart as PieChartComponent, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type AppFlow = "main_menu" | "topic_speech" | "book_summary";

// Main App Component
export default function AuraApp() {
    const [currentFlow, setCurrentFlow] = useState<AppFlow>("main_menu");

    const handleFlowSelect = (flow: AppFlow) => {
        setCurrentFlow(flow);
    };
    
    const handleReset = () => {
        setCurrentFlow("main_menu");
    };

    const renderContent = () => {
        switch (currentFlow) {
            case "topic_speech":
                return <TopicSpeechApp onReset={handleReset} />;
            case "book_summary":
                return <BookSummaryApp onReset={handleReset} />;
            case "main_menu":
            default:
                return (
                    <div className="p-8 text-center min-h-[400px] flex flex-col justify-center items-center">
                        <CardTitle className="mb-2">Choose Your Experience</CardTitle>
                        <CardDescription className="mb-6">How would you like to reflect and improve today?</CardDescription>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                            <button onClick={() => handleFlowSelect('topic_speech')} className="p-6 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all border-dashed border-2 border-transparent hover:border-primary">
                                <MessageSquare className="w-12 h-12 mx-auto text-primary" />
                                <h3 className="font-bold text-lg mt-2">Speech on Topic</h3>
                                <p className="text-sm text-muted-foreground">Speak on a topic and get feedback on your communication.</p>
                            </button>
                            <button onClick={() => handleFlowSelect('book_summary')} className="p-6 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all border-dashed border-2 border-transparent hover:border-primary">
                                <Book className="w-12 h-12 mx-auto text-primary" />
                                <h3 className="font-bold text-lg mt-2">Book Summary</h3>
                                <p className="text-sm text-muted-foreground">Test your comprehension and critical thinking skills.</p>
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="w-full max-w-2xl relative">
          <Card className="w-full bg-card/50 backdrop-blur-lg shadow-2xl border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent -z-10"></div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFlow}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </Card>
        </div>
      );
}


type TopicSpeechAppStep =
  | "topic_selection"
  | "topic_spinning"
  | "topic_selected"
  | "initial_speech"
  | "generating_questions"
  | "question_display"
  | "final_speech"
  | "generating_report"
  | "score_display"
  | "report_display";

const TopicSpeechApp: FC<{ onReset: () => void }> = ({ onReset }) => {
    const [step, setStep] = useState<TopicSpeechAppStep>("topic_selection");
    const [selectedTopic, setSelectedTopic] = useState<string>("");
    const [initialSpeech, setInitialSpeech] = useState("");
    const [questions, setQuestions] = useState<string[]>([]);
    const [speechResponses, setSpeechResponses] = useState<string[]>([]);
    const [report, setReport] = useState<AnalyzeSpeechAndGenerateReportOutput | null>(null);
    const { toast } = useToast();
  
    const handleStartSpin = () => {
      setStep("topic_spinning");
    };
  
    const handleTopicSelected = (topic: string) => {
      setSelectedTopic(topic);
      setStep("topic_selected");
    };
    
    const handleStartInitialSpeech = () => setStep("initial_speech");
  
    const handleInitialSpeechComplete = (transcript: string) => {
      if (!transcript.trim()) {
        toast({ variant: "destructive", title: "Empty Speech", description: "Your initial speech was empty. Please try again." });
        setStep("topic_selected");
        return;
      }
      setInitialSpeech(transcript);
      setStep("generating_questions");
    };
  
    const handleStartFinalSpeech = () => setStep("final_speech");
  
    const handleFinalSpeechComplete = (transcripts: string[]) => {
      const hasEmptyResponse = transcripts.some(t => !t.trim());
      if (hasEmptyResponse || transcripts.length < (questions.length)) {
          toast({ variant: "destructive", title: "Incomplete Answers", description: `You did not answer all ${questions.length} questions. Please try again.` });
          setSpeechResponses([]);
          setStep("question_display"); // Go back to show questions, not start of speech
          return;
      }
      setSpeechResponses(transcripts);
      setStep("generating_report");
    };
  
    const handleShowReport = () => setStep("report_display");
  
    const handleReset = useCallback(() => {
      setStep("topic_selection");
      setSelectedTopic("");
      setInitialSpeech("");
      setQuestions([]);
      setSpeechResponses([]);
      setReport(null);
      onReset();
    }, [onReset]);
    
    useEffect(() => {
      if (step === "generating_questions" && selectedTopic && initialSpeech) {
        generateTopicQuestions({ topic: selectedTopic, speechAnalysis: initialSpeech })
          .then((output: GenerateTopicQuestionsOutput) => {
            setQuestions(output.questions);
            setStep("question_display");
          })
          .catch((error) => {
            console.error("Error generating questions:", error);
            toast({ variant: "destructive", title: "AI Error", description: "Could not generate questions. Please try again." });
            setStep("topic_selected");
          });
      }
    }, [step, selectedTopic, initialSpeech, toast]);
  
    useEffect(() => {
      if (step === "generating_report" && selectedTopic && questions.length > 0 && speechResponses.length > 0) {
        analyzeSpeechAndGenerateReport({ topic: selectedTopic, questions, speechResponses })
          .then((output) => {
            setReport(output);
            setStep("score_display");
          })
          .catch((error) => {
            console.error("Error generating report:", error);
            toast({ variant: "destructive", title: "AI Error", description: "Could not generate the report. Please try again." });
            setStep("question_display");
          });
      }
    }, [step, selectedTopic, questions, speechResponses, toast]);
  
    const CurrentStepComponent = () => {
        switch (step) {
          case "topic_selection": return <TopicSelector onStartSpin={handleStartSpin} onTopicSelect={handleTopicSelected} />;
          case "topic_spinning": return <TopicSpinner items={topics} onSelected={handleTopicSelected} noun="topic" />;
          case "topic_selected": return <TopicSelectedScreen topic={selectedTopic} onStart={handleStartInitialSpeech} onRespin={handleStartSpin} onReset={onReset}/>;
          case "initial_speech": return <SpeechInput key="initial" onComplete={(t) => handleInitialSpeechComplete(t as string)} isSingleResponse={true} title={`Speak about: ${selectedTopic}`} />;
          case "generating_questions": return <LoadingScreen text="Analyzing your thoughts and generating questions..." />;
          case "question_display": return <QuestionDisplayScreen questions={questions} onStart={handleStartFinalSpeech} />;
          case "final_speech": return <SpeechInput key="final" onComplete={(transcripts) => handleFinalSpeechComplete(transcripts as string[])} title="Answer the questions" contextQuestions={questions} />;
          case "generating_report": return <LoadingScreen text="Crafting your personalized Aura report..." />;
          case "score_display": return report ? <ScoreDisplay report={report} onContinue={handleShowReport} /> : <LoadingScreen text="Calculating score..." />;
          case "report_display": return report ? <ReportDisplay report={report} onReset={handleReset} /> : <LoadingScreen text="Loading report..." />;
          default: return <p>Something went wrong.</p>;
        }
      }
  
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                {CurrentStepComponent()}
            </motion.div>
        </AnimatePresence>
    );
};


// Sub-components
const TopicSelector: FC<{ onStartSpin: () => void, onTopicSelect: (topic: string) => void }> = ({ onStartSpin, onTopicSelect }) => {
  const [customTopic, setCustomTopic] = useState("");
  const { toast } = useToast();

  const handleCustomTopicSubmit = () => {
    if (customTopic.trim().length < 3) {
      toast({
        variant: "destructive",
        title: "Topic Too Short",
        description: "Please enter a topic with at least 3 characters.",
      });
      return;
    }
    onTopicSelect(customTopic);
  };
  
  return (
    <div className="p-4 sm:p-8 text-center min-h-[400px] flex flex-col justify-center">
      <CardTitle className="mb-2">Choose Your Topic</CardTitle>
      <CardDescription className="mb-6">How would you like to begin your reflection?</CardDescription>
      <Tabs defaultValue="random" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="random"><Sparkles className="mr-2"/>Random Topic</TabsTrigger>
          <TabsTrigger value="custom"><Wand className="mr-2"/>Custom Topic</TabsTrigger>
        </TabsList>
        <TabsContent value="random">
          <Card className="bg-secondary/30 border-dashed">
            <CardHeader>
              <CardTitle>Spin the Wheel</CardTitle>
              <CardDescription>Let fate decide your topic. Click the button to get a random topic for reflection.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button size="lg" onClick={onStartSpin} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30">
                <Sparkles className="mr-2 h-4 w-4" />
                Spin the Wheel
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="custom">
          <Card className="bg-secondary/30 border-dashed">
             <CardHeader>
              <CardTitle>Enter Your Own</CardTitle>
              <CardDescription>Have something specific in mind? Enter your topic below to get started right away.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input 
                type="text" 
                placeholder="e.g., 'My career goals'" 
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="text-center text-base"
              />
               <Button size="lg" onClick={handleCustomTopicSubmit} className="w-full">
                Start with this Topic <ChevronRight className="ml-2"/>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};


const TopicSpinner: FC<{ items: string[], onSelected: (item: string) => void, noun: string }> = ({ items, onSelected, noun }) => {
    const [displayedItem, setDisplayedItem] = useState(items[0]);

    useEffect(() => {
        const spinDuration = 3000;
        const spinIntervalTime = 300;

        let spinInterval: NodeJS.Timeout;
        let finalTimeout: NodeJS.Timeout;

        spinInterval = setInterval(() => {
            setDisplayedItem(prevItem => {
                let newItem;
                do {
                    newItem = items[Math.floor(Math.random() * items.length)];
                } while (newItem === prevItem);
                return newItem;
            });
        }, spinIntervalTime); 

        const scheduleEnd = setTimeout(() => {
            clearInterval(spinInterval);

            const finalItem = items[Math.floor(Math.random() * items.length)];
            setDisplayedItem(finalItem);
            
            finalTimeout = setTimeout(() => {
                onSelected(finalItem);
            }, 1000); 

        }, spinDuration - 1000);

        return () => {
            clearInterval(spinInterval);
            clearTimeout(scheduleEnd);
            clearTimeout(finalTimeout);
        };
    }, [onSelected, items]);

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-8 text-center min-h-[400px]">
            <CardDescription className="text-lg">Finding your {noun}...</CardDescription>
            <div className="h-24 flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="popLayout">
                    <motion.p
                        key={displayedItem}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.1 }}
                        className="font-headline text-4xl font-bold text-primary text-center"
                    >
                        {displayedItem}
                    </motion.p>
                </AnimatePresence>
            </div>
            <Button size="lg" disabled={true} className="bg-primary/50">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Spinning...
            </Button>
        </div>
    );
};


const TopicSelectedScreen: FC<{ topic: string, onStart: () => void, onRespin: () => void, onReset: () => void }> = ({ topic, onStart, onRespin, onReset }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center min-h-[400px]">
    <p className="text-muted-foreground">Your topic is</p>
    <h2 className="font-headline text-5xl font-bold text-primary">{topic}</h2>
    <p className="text-foreground/70 max-w-md">You will have 60 seconds to speak on this topic. Relax, gather your thoughts, and speak freely. Click Start when you are ready.</p>
    <div className="flex gap-4">
      <Button size="lg" variant="outline" onClick={onReset}>
        <RotateCw className="mr-2 h-4 w-4" />
        Change Mode
      </Button>
      <Button size="lg" onClick={onStart} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30">Start</Button>
    </div>
  </div>
);

const QuestionDisplayScreen: FC<{ questions: string[], onStart: () => void }> = ({ questions, onStart }) => (
  <div className="flex flex-col p-8 space-y-6 min-h-[400px]">
    <h2 className="font-headline text-3xl text-center font-bold text-primary">Here are some questions to guide you:</h2>
    <ul className="space-y-4 pt-4 text-lg text-foreground/80 w-full">
      {questions.map((q, i) => 
        <motion.li 
            key={i} 
            className="p-4 bg-secondary/50 rounded-lg border-l-4 border-primary"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
        >
          {q}
        </motion.li>
      )}
    </ul>
    <p className="text-muted-foreground text-center !mt-8">You will have 60 seconds to answer each question. Press the microphone to start recording for each answer.</p>
    <div className="flex justify-center">
      <Button size="lg" onClick={onStart} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30">Start Answering</Button>
    </div>
  </div>
);

const LoadingScreen: FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center p-12 space-y-4 min-h-[400px]">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
    <p className="font-headline text-xl text-foreground/80 animate-pulse">{text}</p>
  </div>
);

const RECORD_DURATION = 60000; // 60 seconds

const SpeechInput: FC<{ onComplete: (t: string | string[]) => void; isSingleResponse?: boolean; title: string, contextQuestions?: string[] }> = ({ onComplete, isSingleResponse = false, title, contextQuestions }) => {
    const [responses, setResponses] = useState<string[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentTranscript, setCurrentTranscript] = useState("");
    const [timeLeft, setTimeLeft] = useState(RECORD_DURATION / 1000);
    const [textInput, setTextInput] = useState("");
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const { toast } = useToast();

    const isDone = !isSingleResponse && currentQuestionIndex === contextQuestions?.length;
    
    const handleNextQuestion = useCallback((finalTranscript: string) => {
        const newResponses = [...responses, finalTranscript];
        setResponses(newResponses);
        setCurrentTranscript("");
        setTextInput("");

        if (currentQuestionIndex < (contextQuestions?.length || 0) - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            onComplete(newResponses);
        }
    }, [responses, currentQuestionIndex, contextQuestions, onComplete]);


    const handleTranscriptionComplete = useCallback((finalTranscript: string) => {
        if (!finalTranscript.trim()) {
            toast({ variant: "destructive", title: "Empty Speech", description: "No speech was detected. Please try again." });
            setCurrentTranscript("");
            return;
        }
        setCurrentTranscript(finalTranscript);

        if (isSingleResponse) {
            onComplete(finalTranscript);
        } else {
            // In multi-question mode, the "Next" button handles advancing
        }
    }, [isSingleResponse, onComplete, toast]);

    const { 
        isListening, 
        error, 
        isSupported, 
        startListening, 
        stopListening, 
        isProcessing
    } = useSpeechRecognition({ onTranscriptionComplete: handleTranscriptionComplete });

    const permissionError = error && error.includes('denied');
  
    const handleStopAndProcess = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (isListening) {
            stopListening();
        }
    }, [isListening, stopListening]);
  
    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }, []);
  
    // Countdown timer effect
    useEffect(() => {
        if (isListening) {
            setTimeLeft(RECORD_DURATION / 1000); // Reset timer on new recording
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleStopAndProcess();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isListening, handleStopAndProcess]);
    
    const handleMicClick = () => {
        if (isListening) {
            handleStopAndProcess();
        } else if (!isDone) {
            startListening();
        }
    };
  
    const handleTextSubmit = () => {
        if (isDone) return;
        if (textInput.trim()) {
             if (isSingleResponse) {
                onComplete(textInput);
            } else {
                handleNextQuestion(textInput);
            }
        }
    };

    const handleMultiQuestionNext = () => {
        if(isDone) return;
        if(currentTranscript.trim()) {
            handleNextQuestion(currentTranscript);
        } else {
            toast({ variant: "destructive", title: "No Response", description: "Please record or type a response before proceeding." });
        }
    }
  
    if (isSupported === null) {
        return <LoadingScreen text="Checking browser compatibility..." />
    }

    const currentQuestion = contextQuestions?.[currentQuestionIndex];
  
    return (
        <div className="p-8 flex flex-col space-y-4 min-h-[400px]">
            <h2 className="font-headline text-3xl font-bold text-primary text-center">{title}</h2>
      
            {permissionError && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Microphone Access Denied</AlertTitle>
                    <AlertDescription>
                        You need to allow microphone access in your browser settings to use the speech recognition feature.
                    </AlertDescription>
                </Alert>
            )}

            {error && !permissionError && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>An Error Occurred</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {contextQuestions && (
                <Card className="bg-secondary p-4 border-l-4 border-primary">
                    <CardDescription>
                        {!isDone ? `Question ${currentQuestionIndex + 1} of ${contextQuestions.length}`: 'All questions answered!'}
                    </CardDescription>
                    <CardTitle className="text-lg">
                        {!isDone ? currentQuestion : 'Thank you for your responses.'}
                    </CardTitle>
                </Card>
            )}

            {isSupported ? (
                <>
                    <div className="min-h-[150px] bg-secondary/30 p-4 rounded-md border border-border text-foreground flex flex-col items-center justify-center text-center">
                        {isListening ? (
                            <>
                                <Mic className="h-8 w-8 mx-auto text-primary animate-pulse" />
                                <p className="text-muted-foreground mt-2">Listening...</p>
                            </>
                        ) : (
                             <p className="text-muted-foreground">
                                {isDone ? 'All responses recorded. Thank you!' : (isProcessing ? "Processing..." : (currentTranscript ? `"${currentTranscript}"` : 'Press the microphone to start recording.'))}
                            </p>
                        )}
                        {isProcessing && !isListening && <Loader2 className="h-6 w-6 text-primary animate-spin mt-2" />}
                    </div>

                    {!isDone && (
                        <div className="flex flex-col items-center space-y-4">
                            <Button size="lg" variant={isListening ? "destructive" : "default"} onClick={handleMicClick} disabled={permissionError || isProcessing} className="w-40 shadow-lg shadow-primary/20">
                                {isListening ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                                {isListening ? `Stop (${timeLeft}s)` : isProcessing ? <Loader2 className="animate-spin" /> : 'Speak'}
                            </Button>
                            {isListening && <Progress value={(timeLeft / (RECORD_DURATION / 1000)) * 100} className="w-full h-2" />}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <p className="text-center text-sm text-muted-foreground">Speech recognition is not supported. Please type your response.</p>
                    <Textarea 
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder={isSingleResponse ? "Type your response here..." : (isDone ? "All done" : currentQuestion)}
                        className="min-h-[150px] bg-secondary/30"
                        disabled={isDone}
                    />
                </>
            )}
             
            {!isSingleResponse && !isDone && (
                <div className="flex justify-end pt-4">
                    <Button onClick={handleMultiQuestionNext} disabled={isProcessing}>
                        Next Question <ChevronRight className="ml-2"/>
                    </Button>
                </div>
            )}
      
            {responses.length > 0 && !isSingleResponse && (
                <div className="space-y-2 pt-4">
                    <h3 className="font-semibold">Your Answers:</h3>
                    <ul className="space-y-2 list-decimal list-inside bg-muted/50 p-4 rounded-md text-sm text-foreground/80">
                        {responses.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
};


type ChartData = {
  type: 'bar' | 'pie';
  title: string;
  data: any[];
  config?: ChartConfig;
}

const ScoreDisplay: FC<{ report: AnalyzeSpeechAndGenerateReportOutput | AnalyzeBookAnswersOutput; onContinue: () => void }> = ({ report, onContinue }) => {
  const { cumulativeScore, grade, gradeColor } = useMemo(() => {
    try {
      if (!report.chartsData || typeof report.chartsData !== 'string') {
        throw new Error("chartsData is missing or not a string");
      }

      const charts: ChartData[] = JSON.parse(report.chartsData);
      const barCharts = charts.filter(c => c.type === 'bar' && Array.isArray(c.data));
      
      if (barCharts.length === 0) {
        return { cumulativeScore: 0, grade: "Not Available", gradeColor: "bg-muted text-muted-foreground" };
      }
      
      const allScores = barCharts.flatMap(chart => 
        chart.data.map(item => item.score).filter(score => typeof score === 'number' && !isNaN(score))
      );

      if (allScores.length === 0) {
        return { cumulativeScore: 0, grade: "Not Available", gradeColor: "bg-muted text-muted-foreground" };
      }

      const totalScore = allScores.reduce((sum, score) => sum + score, 0);
      const score = Math.round(totalScore / allScores.length);
      
      let grade = "Needs Improvement";
      let gradeColor = "bg-destructive text-destructive-foreground";
      if (score > 85) {
        grade = "Excellent";
        gradeColor = "bg-green-500 text-white";
      } else if (score > 70) {
        grade = "Very Good";
        gradeColor = "bg-primary text-primary-foreground";
      } else if (score > 50) {
        grade = "Good";
        gradeColor = "bg-accent text-accent-foreground";
      }
      
      return { cumulativeScore: score, grade, gradeColor };

    } catch (e) {
      console.error("Failed to parse or calculate score:", e);
      return { cumulativeScore: 0, grade: "Error", gradeColor: "bg-destructive text-destructive-foreground" };
    }
  }, [report.chartsData]);
  
  const circumference = 2 * Math.PI * 90;

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center min-h-[400px]">
      <h2 className="font-headline text-4xl font-bold text-primary">Your Cumulative Score</h2>
      
      <div className="relative h-52 w-52">
        <svg className="h-full w-full" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" stroke="hsl(var(--secondary))" strokeWidth="15" fill="transparent" />
          
          <motion.circle
            cx="100"
            cy="100"
            r="90"
            stroke="url(#scoreGradient)"
            strokeWidth="15"
            fill="transparent"
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (cumulativeScore / 100) * circumference }}
            transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
          />
           <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary to-indigo-500"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "backOut" }}
          >
            {cumulativeScore}
          </motion.span>
        </div>
      </div>
       
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
        <Badge className={`text-lg px-4 py-2 ${gradeColor} shadow-lg`}>{grade}</Badge>
      </motion.div>

      <p className="text-muted-foreground max-w-sm">
        This score represents an overall evaluation of your communication skills and personality traits.
      </p>

      <Button size="lg" onClick={onContinue} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30">
        View Detailed Report
      </Button>
    </div>
  );
};


const ReportDisplay: FC<{ report: AnalyzeSpeechAndGenerateReportOutput | AnalyzeBookAnswersOutput, onReset: () => void }> = ({ report, onReset }) => {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const { cumulativeScore, grade } = useMemo(() => {
    try {
      if (!report.chartsData || typeof report.chartsData !== 'string') {
        throw new Error("chartsData is missing or not a string");
      }
      const charts: ChartData[] = JSON.parse(report.chartsData);
      const barCharts = charts.filter(c => c.type === 'bar' && Array.isArray(c.data));
      if (barCharts.length === 0) return { cumulativeScore: 0, grade: "Not Available" };
      
      const allScores = barCharts.flatMap(chart => chart.data.map(item => item.score).filter(score => typeof score === 'number' && !isNaN(score)));
      if (allScores.length === 0) return { cumulativeScore: 0, grade: "Not Available" };

      const totalScore = allScores.reduce((sum, score) => sum + score, 0);
      const score = Math.round(totalScore / allScores.length);
      
      let calculatedGrade = "Needs Improvement";
      if (score > 85) calculatedGrade = "Excellent";
      else if (score > 70) calculatedGrade = "Very Good";
      else if (score > 50) calculatedGrade = "Good";
      
      return { cumulativeScore: score, grade: calculatedGrade };
    } catch (e) {
      console.error("Failed to parse or calculate score for email:", e);
      return { cumulativeScore: 0, grade: "Error" };
    }
  }, [report.chartsData]);

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      toast({ variant: "destructive", title: "Invalid Email", description: "Please enter a valid email address." });
      return;
    }
    setIsSending(true);
    try {
      const result = await sendReportEmail({
        email,
        report: report.report,
        title: "Aura+ Report", // This is a placeholder title
        score: cumulativeScore,
        grade: grade,
      });
      if (result.success) {
        toast({ title: "Email Sent", description: "Your Aura report has been sent to your email." });
      } else {
        throw new Error(result.message || "Failed to send email.");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Email Error", description: error.message || "Could not send the report." });
    } finally {
      setIsSending(false);
    }
  };

  const charts: ChartData[] = useMemo(() => {
    try {
      if (typeof report.chartsData === 'string') {
        const parsedData = JSON.parse(report.chartsData);
        return Array.isArray(parsedData) ? parsedData : [];
      }
      return Array.isArray(report.chartsData) ? report.chartsData as ChartData[] : [];
    } catch (e) {
      console.error("Failed to parse chartsData:", e);
      return [];
    }
  }, [report.chartsData]);

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-headline text-4xl font-bold text-primary">Your Aura Report</h2>
      </div>
      
      <Card className="bg-secondary/30">
        <CardHeader>
          <CardTitle>Email Your Report</CardTitle>
          <CardDescription>Enter your email address to receive a copy of your report.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input 
            type="email" 
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSending}
            className="bg-background/50"
          />
          <Button onClick={handleSendEmail} disabled={isSending} className="w-full sm:w-auto">
            {isSending ? <Loader2 className="mr-2 animate-spin" /> : <Mail className="mr-2"/>}
            Send Email
          </Button>
        </CardContent>
      </Card>
      
      <Card className="bg-secondary/30">
        <CardHeader>
          <CardTitle>Personality Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-foreground/90">{report.report}</p>
        </CardContent>
      </Card>

      {charts.map((chart, index) => (
        <Card key={index} className="bg-secondary/30">
          <CardHeader>
            <CardTitle>{chart.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {chart.type === 'bar' && chart.config && chart.data?.length > 0 && (
              <ChartContainer config={chart.config} className="min-h-[200px] w-full">
                <BarChartComponent accessibilityLayer data={chart.data}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)"/>
                  <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={4} />
                </BarChartComponent>
              </ChartContainer>
            )}
            {chart.type === 'pie' && chart.data?.length > 0 && (
              <ChartContainer config={chart.config || {}} className="mx-auto aspect-square h-[250px]">
                <PieChartComponent>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                     {chart.data.map((entry: any, idx: number) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChartComponent>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      ))}
      
      <div className="text-center">
        <Button size="lg" onClick={onReset}>
          <RotateCw className="mr-2 h-4 w-4"/> Start Over
        </Button>
      </div>
    </div>
  );
};


type BookSummaryAppStep =
  | "book_selection"
  | "book_spinning"
  | "book_selected"
  | "generating_summary"
  | "timer_selection"
  | "summary_display"
  | "generating_questions"
  | "rapid_fire_questions"
  | "follow_up_questions"
  | "generating_report"
  | "score_display"
  | "report_display";

const BookSummaryApp: FC<{ onReset: () => void }> = ({ onReset }) => {
    const [step, setStep] = useState<BookSummaryAppStep>("book_selection");
    const [selectedBook, setSelectedBook] = useState("");
    const [summary, setSummary] = useState("");
    const [summaryTime, setSummaryTime] = useState(300);
    const [questions, setQuestions] = useState<GenerateBookQuestionsOutput | null>(null);
    const [rapidFireAnswers, setRapidFireAnswers] = useState<string[]>([]);
    const [followUpAnswers, setFollowUpAnswers] = useState<string[]>([]);
    const [report, setReport] = useState<AnalyzeBookAnswersOutput | null>(null);
    const { toast } = useToast();

    const handleBookSelected = (book: string) => {
        setSelectedBook(book);
        setStep("book_selected");
    };

    const handleStartWithBook = () => {
        setStep("generating_summary");
    }

    const handleTimerSelected = (time: number) => {
        setSummaryTime(time);
        setStep("summary_display");
    }

    const handleReset = useCallback(() => {
        setStep("book_selection");
        setSelectedBook("");
        setSummary("");
        setQuestions(null);
        setRapidFireAnswers([]);
        setFollowUpAnswers([]);
        setReport(null);
        onReset();
    }, [onReset]);

    useEffect(() => {
        if (step === "generating_summary" && selectedBook) {
            getBookSummary({ title: selectedBook })
                .then(output => {
                    setSummary(output.summary);
                    setStep("timer_selection");
                })
                .catch(error => {
                    console.error("Error generating summary:", error);
                    toast({ variant: "destructive", title: "AI Error", description: "Could not generate the book summary." });
                    setStep("book_selection");
                });
        }
    }, [step, selectedBook, toast]);

    useEffect(() => {
        if (step === "generating_questions" && selectedBook && summary) {
            generateBookQuestions({ bookTitle: selectedBook, summary })
                .then(output => {
                    setQuestions(output);
                    setStep("rapid_fire_questions");
                })
                .catch(error => {
                    console.error("Error generating questions:", error);
                    toast({ variant: "destructive", title: "AI Error", description: "Could not generate questions for the book." });
                    setStep("summary_display");
                });
        }
    }, [step, selectedBook, summary, toast]);

    const handleStartSpin = () => {
      setStep("book_spinning");
    };
    
    const handleStartQuestions = () => {
        setStep("generating_questions");
    };

    const handleRapidFireComplete = (answers: string[]) => {
        setRapidFireAnswers(answers);
        setStep("follow_up_questions");
    };

    const handleFollowUpComplete = (answers: string[]) => {
        setFollowUpAnswers(answers);
        setStep("generating_report");
    };

    const handleShowReport = () => {
        setStep("report_display");
    };

    useEffect(() => {
        if (step === "generating_report" && questions) {
            analyzeBookAnswers({
                bookTitle: selectedBook,
                bookSummary: summary,
                rapidFireQuestions: questions.rapidFireQuestions,
                rapidFireAnswers: rapidFireAnswers,
                followUpQuestions: questions.followUpQuestions,
                followUpAnswers: followUpAnswers,
            })
            .then(output => {
                setReport(output);
                setStep("score_display");
            })
            .catch(error => {
                console.error("Error analyzing answers:", error);
                toast({ variant: "destructive", title: "AI Error", description: "Could not analyze your answers." });
                setStep("follow_up_questions");
            });
        }
    }, [step, questions, selectedBook, summary, rapidFireAnswers, followUpAnswers, toast]);


    const CurrentStepComponent = () => {
        switch (step) {
            case "book_selection":
                return <TopicSelector onStartSpin={handleStartSpin} onTopicSelect={handleBookSelected} />;
            case "book_spinning":
                return <TopicSpinner items={books} onSelected={handleBookSelected} noun="book" />;
            case "book_selected":
                return <BookSelectedScreen book={selectedBook} onStart={handleStartWithBook} onRespin={handleStartSpin} onReset={handleReset} />;
            case "generating_summary":
                return <LoadingScreen text={`Generating summary for ${selectedBook}...`} />;
            case "timer_selection":
                return <TimerSelectionScreen onTimerSelect={handleTimerSelected} />;
            case "summary_display":
                return <SummaryDisplay summary={summary} onStart={handleStartQuestions} analysisTime={summaryTime} />;
            case "generating_questions":
                return <LoadingScreen text="Generating questions..." />;
            case "rapid_fire_questions":
                return questions ? <RapidFireQuestionScreen questions={questions.rapidFireQuestions} onComplete={handleRapidFireComplete} /> : <LoadingScreen text="Loading questions..."/>;
            case "follow_up_questions":
                return questions ? <SpeechInput key="follow-up" title="Follow-up Questions" contextQuestions={questions.followUpQuestions} onComplete={(t) => handleFollowUpComplete(t as string[])}/> : <LoadingScreen text="Loading questions..."/>;
            case "generating_report":
                return <LoadingScreen text="Analyzing your answers and generating report..." />;
            case "score_display":
                return report ? <ScoreDisplay report={report} onContinue={handleShowReport} /> : <LoadingScreen text="Calculating score..." />;
            case "report_display":
                return report ? <ReportDisplay report={report} onReset={handleReset} /> : <LoadingScreen text="Loading report..." />;
            default:
                return <p>Something went wrong.</p>;
        }
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                {CurrentStepComponent()}
            </motion.div>
        </AnimatePresence>
    );
};

const BookSelectedScreen: FC<{ book: string, onStart: () => void, onRespin: () => void, onReset: () => void }> = ({ book, onStart, onRespin, onReset }) => (
    <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center min-h-[400px]">
      <p className="text-muted-foreground">Your book is</p>
      <h2 className="font-headline text-5xl font-bold text-primary">{book}</h2>
      <p className="text-foreground/70 max-w-md">We'll generate a short summary of this book, then ask you some questions about it. Click Start when you're ready.</p>
      <div className="flex flex-wrap justify-center gap-4">
        <Button size="lg" variant="outline" onClick={onReset}>
          <RotateCw className="mr-2 h-4 w-4" />
          Change Mode
        </Button>
        <Button size="lg" variant="outline" onClick={onRespin}>
          <Sparkles className="mr-2 h-4 w-4" />
          Respin
        </Button>
        <Button size="lg" onClick={onStart} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30">Start</Button>
      </div>
    </div>
);

const TimerSelectionScreen: FC<{ onTimerSelect: (time: number) => void }> = ({ onTimerSelect }) => {
    const [value, setValue] = useState("300");
  
    return (
      <div className="flex flex-col p-8 space-y-6 min-h-[400px] justify-center items-center">
        <h2 className="font-headline text-3xl text-center font-bold text-primary">Set Your Analysis Time</h2>
        <p className="text-muted-foreground text-center max-w-sm">Choose how long you want to read the summary before the questions begin.</p>
        <RadioGroup defaultValue="300" className="flex flex-wrap justify-center gap-x-6 gap-y-4 pt-4" onValueChange={setValue}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="180" id="r1" />
            <Label htmlFor="r1" className="text-lg">3 minutes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="300" id="r2" />
            <Label htmlFor="r2" className="text-lg">5 minutes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="420" id="r3" />
            <Label htmlFor="r3" className="text-lg">7 minutes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="600" id="r4" />
            <Label htmlFor="r4" className="text-lg">10 minutes</Label>
          </div>
        </RadioGroup>
        <div className="pt-4">
            <Button size="lg" onClick={() => onTimerSelect(parseInt(value))}>
                Continue <ChevronRight className="ml-2"/>
            </Button>
        </div>
      </div>
    );
};
  
const SummaryDisplay: FC<{ summary: string, onStart: () => void, analysisTime: number }> = ({ summary, onStart, analysisTime }) => {
    const [timeLeft, setTimeLeft] = useState(analysisTime);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [analysisTime]);
    
    const handleStartClick = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        onStart();
    };

    const isTimeUp = timeLeft <= 0;

    return (
        <div className="flex flex-col p-8 space-y-4 min-h-[400px]">
            <div className="flex justify-between items-center bg-secondary/40 p-2 rounded-md">
                <h2 className="font-headline text-2xl text-center font-bold text-primary">Book Summary</h2>
                <div className="flex items-center gap-2 font-mono text-lg font-semibold text-primary">
                    <Timer />
                    <span>{String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}</span>
                </div>
            </div>

            <Card className="bg-secondary/50 flex-grow">
                <CardContent className="p-6">
                    <p className="text-foreground/80 leading-relaxed">{summary}</p>
                </CardContent>
            </Card>

            <p className="text-muted-foreground text-center text-sm">
                {isTimeUp ? "Time's up! You can now proceed to the questions." : "Read the summary carefully, or click the button below when you're ready."}
            </p>

            <div className="flex justify-center">
                <Button 
                    size="lg" 
                    onClick={handleStartClick}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
                >
                    {isTimeUp ? "Proceed to Questions" : "I'm Ready for Questions"}
                </Button>
            </div>
        </div>
    );
};


const RapidFireQuestionScreen: FC<{ questions: string[], onComplete: (answers: string[]) => void }> = ({ questions, onComplete }) => {
    const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""));
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const handleAnswerChange = (index: number, value: string) => {
        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            onComplete(answers);
        }
    };
    
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    return (
        <div className="p-8 flex flex-col space-y-4 min-h-[400px]">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col space-y-4"
                >
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Rapid-Fire Question {currentQuestionIndex + 1} of {questions.length}</p>
                        <h3 className="font-semibold text-xl mt-1">{questions[currentQuestionIndex]}</h3>
                    </div>
                    <TextareaAutosize
                        value={answers[currentQuestionIndex]}
                        onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full p-2 rounded-md border bg-background min-h-[100px] resize-none"
                        maxRows={5}
                    />
                </motion.div>
            </AnimatePresence>
            <div className="flex justify-end pt-4">
                <Button onClick={handleNext}>
                    {isLastQuestion ? "Finish" : "Next"} <ChevronRight className="ml-2"/>
                </Button>
            </div>
            <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="w-full" />
        </div>
    );
};

    
