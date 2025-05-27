
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { List, PlusCircle, Play, Pause, RotateCcw, Trash2, ShieldAlert, Link, ExternalLink, XCircle, Settings2, Minimize, Maximize, Loader2, MousePointerClick, Expand, Shrink, GraduationCap, MessageSquare, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const FOCUS_DURATION_MIN = 25;
const BREAK_DURATION_MIN = 5;
const WHITELIST_STORAGE_KEY = 'studyPlannerWhitelist';

// Use the user-provided URL for the Guru chatbot embed
const GURU_CHATBOT_EMBED_URL = "https://guru-bot-steel.vercel.app/"; 

export default function FocusModePage() {
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [iframeSrc, setIframeSrc] = useState('');
  const [currentIframeUrl, setCurrentIframeUrl] = useState('');
  const [isLoadingWhitelist, setIsLoadingWhitelist] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Pomodoro State
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION_MIN * 60);
  const [isActive, setIsActive] = useState(false);
  const [focusDuration, setFocusDuration] = useState(FOCUS_DURATION_MIN);
  const [breakDuration, setBreakDuration] = useState(BREAK_DURATION_MIN);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Focused Browser Expansion State
  const [isFocusedBrowserMaximized, setIsFocusedBrowserMaximized] = useState(false);

  // Guru Chatbot Panel State
  const [isGuruPanelOpen, setIsGuruPanelOpen] = useState(false);
  const [isGuruPanelMaximized, setIsGuruPanelMaximized] = useState(false);


  const { toast } = useToast();

  useEffect(() => {
    loadWhitelistFromLocalStorage();
  }, []);

  const loadWhitelistFromLocalStorage = () => {
    setIsLoadingWhitelist(true);
    try {
      const storedWhitelistJson = localStorage.getItem(WHITELIST_STORAGE_KEY);
      if (storedWhitelistJson) {
        const parsedWhitelist = JSON.parse(storedWhitelistJson);
        if (Array.isArray(parsedWhitelist)) {
          setWhitelist(parsedWhitelist);
        } else {
          setWhitelist([]);
        }
      } else {
        setWhitelist([]);
      }
    } catch (error) {
      console.error("Error loading whitelist from localStorage:", error);
      toast({ title: "Error", description: "Could not load your website whitelist from local storage.", variant: "destructive" });
      setWhitelist([]);
    } finally {
      setIsLoadingWhitelist(false);
    }
  };

  const saveWhitelistToLocalStorage = (currentWhitelist: string[]) => {
    try {
      localStorage.setItem(WHITELIST_STORAGE_KEY, JSON.stringify(currentWhitelist));
    } catch (error) {
      console.error("Error saving whitelist to localStorage:", error);
      toast({ title: "Error", description: "Could not save whitelist changes.", variant: "destructive" });
    }
  };

  const ensureUrlScheme = (url: string): string => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const handleAddUrl = async () => {
    let processedUrl = newUrl.trim();
    if (!processedUrl) {
      toast({ title: "Invalid URL", description: "Please enter a URL.", variant: "destructive" });
      return;
    }
    processedUrl = ensureUrlScheme(processedUrl);

    if (!isValidUrl(processedUrl)) {
      toast({ title: "Invalid URL", description: "Please enter a valid URL (e.g., https://example.com).", variant: "destructive" });
      return;
    }
    const normalizedUrl = normalizeUrl(processedUrl);
    if (whitelist.includes(normalizedUrl)) {
      toast({ title: "Duplicate URL", description: "This URL is already in your whitelist.", variant: "default" });
      setNewUrl('');
      return;
    }

    setIsAddingUrl(true);
    try {
      // Client-side HEAD request for basic reachability check
      const response = await fetch(normalizedUrl, { method: 'HEAD', mode: 'cors' }); 
      // Note: 'cors' mode for HEAD requests can still be blocked by servers without appropriate headers.
      // A successful response (even an opaque one for 'no-cors') might indicate the server exists.
      // However, response.ok will likely be false for opaque responses.
      // For this check, we are mostly interested if the fetch doesn't throw a network error.
      // A more robust check might involve a backend proxy if strict verification is needed.

      // If we want to be stricter and only add if response.ok:
      if (response.ok) { // This checks for 2xx status codes
        const updatedWhitelist = [...whitelist, normalizedUrl];
        setWhitelist(updatedWhitelist);
        saveWhitelistToLocalStorage(updatedWhitelist);
        setNewUrl('');
        toast({ title: "Success", description: `${getHostname(normalizedUrl) || normalizedUrl} added to whitelist.` });
      } else {
         // This block will be hit if the server responds with 4xx/5xx or if response.ok is false due to CORS for HEAD.
         toast({
          title: "Website Not Added",
          description: `Could not verify "${getHostname(normalizedUrl) || normalizedUrl}". The server responded with status: ${response.status}. It won't be added.`,
          variant: "destructive",
        });
      }
    } catch (error) { // This catches network errors (DNS fail, server down, CORS completely blocking)
      console.warn("Website verification fetch failed:", error);
      toast({
        title: "Website Not Added",
        description: `Could not verify "${getHostname(normalizedUrl) || normalizedUrl}" due to network issues or browser restrictions (e.g., CORS). It won't be added to the whitelist.`,
        variant: "destructive",
      });
    } finally {
      setIsAddingUrl(false);
    }
  };

  const handleRemoveUrl = async (urlToRemove: string) => {
    const updatedWhitelist = whitelist.filter(url => url !== urlToRemove);
    setWhitelist(updatedWhitelist);
    saveWhitelistToLocalStorage(updatedWhitelist);
    toast({ title: "Success", description: `${getHostname(urlToRemove) || urlToRemove} removed from whitelist.` });
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  const normalizeUrl = (url: string): string => {
    try {
      const parsedUrl = new URL(url);
      // Return just protocol and hostname for general whitelisting
      // return `${parsedUrl.protocol}//${parsedUrl.hostname}`;
      // Or, return with path if more specific whitelisting is needed
       return `${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.pathname === '/' ? '' : parsedUrl.pathname}`;
    } catch {
      // If it's not a valid URL, return original to let validation handle it
      return url; 
    }
  }

  const getHostname = (url: string): string | null => {
    try {
        return new URL(url).hostname;
    } catch {
        return null;
    }
  }

  const handleLoadInIframe = () => {
    let targetUrl = iframeSrc.trim();
    if (!targetUrl) {
      setModalMessage("Please enter a URL to load.");
      setIsModalOpen(true);
      setCurrentIframeUrl('about:blank');
      return;
    }

    targetUrl = ensureUrlScheme(targetUrl);

    if (!isValidUrl(targetUrl)) {
      setModalMessage("Please enter a valid URL to load.");
      setIsModalOpen(true);
      setCurrentIframeUrl('about:blank');
      return;
    }

    const targetHostname = getHostname(targetUrl);

    // Check against normalized whitelist entries (hostnames)
    const isWhitelisted = whitelist.some(whitelistedUrlEntry => {
        const whitelistedHostname = getHostname(whitelistedUrlEntry);
        // Allow if target hostname is identical to a whitelisted hostname,
        // or if target hostname is a subdomain of a whitelisted hostname.
        // e.g., if "example.com" is whitelisted, "www.example.com" or "app.example.com" is allowed.
        return (targetHostname && whitelistedHostname && (targetHostname === whitelistedHostname || targetHostname.endsWith(`.${whitelistedHostname}`))) || whitelistedUrlEntry === targetUrl;
    });

    if (isWhitelisted) {
      setCurrentIframeUrl(targetUrl);
    } else {
      setModalMessage(`The site "${targetHostname || targetUrl}" is not on your study list. Stay focused!`);
      setIsModalOpen(true);
      setCurrentIframeUrl('about:blank'); 
    }
  };

  const handleIframeError = () => {
    const siteName = getHostname(currentIframeUrl) || "The requested site";
    setModalMessage(`${siteName} refused to connect or could not be loaded. Many websites prevent embedding for security reasons (e.g., X-Frame-Options header). Try accessing it in a normal browser tab if needed, or ensure it's a site that allows embedding.`);
    setIsModalOpen(true);
    setCurrentIframeUrl('about:blank'); 
  };

  const handleLoadUrlFromWhitelist = (urlToLoad: string) => {
    const ensuredUrl = ensureUrlScheme(urlToLoad); // Ensure it has https://
    setIframeSrc(ensuredUrl); // Update the input field as well
    setCurrentIframeUrl(ensuredUrl); // Load it directly
  };

  const completeSession = useCallback(async (completed: boolean) => {
    // Pomodoro session logging to Firestore is disabled for no-login mode.
    // If you re-enable login and Firestore logging, this is where it would go.
    // Example:
    // if (currentUser && sessionStartTime) {
    //   try {
    //     await logPomodoroSession(currentUser.uid, {
    //       type: timerMode,
    //       startTime: sessionStartTime,
    //       configuredDuration: timerMode === 'focus' ? focusDuration : breakDuration,
    //       actualDuration: (Date.now() - sessionStartTime) / (1000 * 60), // in minutes
    //       completed: completed,
    //       endTime: Date.now(),
    //     });
    //     toast({ title: "Session Logged", description: `Your ${timerMode} session was logged.`});
    //   } catch (error) {
    //     console.error("Error logging session:", error);
    //     toast({ title: "Logging Error", description: "Could not log your session.", variant: "destructive"});
    //   }
    // }
  }, []);


  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      completeSession(true); // Mark session as completed
      // Switch timer mode
      if (timerMode === 'focus') {
        toast({ title: "Focus Time Over!", description: "Time for a break." });
        setTimerMode('break');
        setTimeLeft(breakDuration * 60);
      } else {
        toast({ title: "Break Over!", description: "Back to focus." });
        setTimerMode('focus');
        setTimeLeft(focusDuration * 60);
      }
       setSessionStartTime(Date.now()); // Start new session internally
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft, timerMode, breakDuration, focusDuration, completeSession, toast]);

  const handleStartPause = () => {
    if (!isActive && !sessionStartTime) { // Starting a brand new session
        setSessionStartTime(Date.now());
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    if(isActive || sessionStartTime) { // If a session was active or had started
      completeSession(false); // Mark current session as not completed because it's reset
    }
    setIsActive(false);
    setSessionStartTime(null); // Clear session start time
    // Reset to current mode's default duration
    setTimeLeft((timerMode === 'focus' ? focusDuration : breakDuration) * 60);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentTimerDuration = timerMode === 'focus' ? focusDuration * 60 : breakDuration * 60;
  const progressPercentage = currentTimerDuration > 0 ? ((currentTimerDuration - timeLeft) / currentTimerDuration) * 100 : 0;

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullScreen(true)).catch(err => {
        toast({variant: "destructive", title: "Fullscreen Error", description: `Error attempting to enable full-screen mode: ${err.message}`});
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullScreen(false));
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleGuruPanel = () => setIsGuruPanelOpen(!isGuruPanelOpen);
  const toggleGuruPanelMaximize = () => setIsGuruPanelMaximized(!isGuruPanelMaximized);


  if (isFullScreen && isActive) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-8">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl text-center">
              {timerMode === 'focus' ? 'Focus Time' : 'Break Time'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="my-8 text-8xl font-bold">{formatTime(timeLeft)}</div>
            <Progress value={progressPercentage} className="w-full h-4 mb-6" />
             <div className="flex flex-col items-center gap-3">
                <div className="flex justify-center w-full gap-3">
                    <Button onClick={handleStartPause} size="default" className="flex-1">
                    {isActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                    {isActive ? 'Pause' : 'Start'}
                    </Button>
                    <Button onClick={handleReset} variant="outline" size="default" className="flex-1">
                    <RotateCcw className="mr-2" /> Reset
                    </Button>
                </div>
                <Button onClick={toggleFullScreen} variant="outline" size="default" title="Exit Fullscreen" className="w-full mt-2">
                    <Minimize className="mr-2" /> Exit Fullscreen
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Focus Mode" description="Manage your allowed websites and use the Pomodoro timer. Settings are saved locally in your browser." />

      <div className={cn(
          "grid gap-6",
          isFocusedBrowserMaximized ? "grid-cols-1" : "md:grid-cols-3" 
        )}>
        {/* Whitelist Management Card */}
        <Card className={cn("shadow-lg", isFocusedBrowserMaximized && "hidden")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><List className="w-5 h-5 text-primary" /> Website Whitelist</CardTitle>
            <CardDescription>Add or remove websites allowed during focus sessions. Click a site to load it.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingWhitelist ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2">Loading whitelist...</span>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  <Input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="example.com"
                    className="flex-grow"
                    disabled={isAddingUrl}
                  />
                  <Button onClick={handleAddUrl} disabled={isAddingUrl}>
                    {isAddingUrl ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <PlusCircle className="w-4 h-4 mr-2 sm:hidden lg:inline" />
                    )}
                    Add
                  </Button>
                </div>
                {whitelist.length > 0 ? (
                  <ScrollArea className="h-48 border rounded-md">
                    <ul className="p-2 space-y-1">
                      {whitelist.map(url => (
                        <li key={url} className="flex items-center justify-between p-1.5 rounded hover:bg-secondary group">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleLoadUrlFromWhitelist(url)}
                            className="h-auto p-1 text-sm text-left truncate text-foreground hover:text-primary group-hover:text-primary"
                            title={`Load ${getHostname(url) || url}`}
                          >
                            <MousePointerClick className="inline-block w-3 h-3 mr-1.5 opacity-50 group-hover:opacity-100" />
                            {getHostname(url) || url}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveUrl(url)} className="w-6 h-6 text-destructive hover:text-destructive opacity-50 group-hover:opacity-100">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-center text-muted-foreground">Your whitelist is empty. Add some study sites!</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Pomodoro Timer Card */}
        <Card className={cn("shadow-lg", isFocusedBrowserMaximized && "hidden")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Pomodoro Timer
            </CardTitle>
            <CardDescription>Stay focused with timed work and break intervals. Sessions are not logged.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Badge variant={timerMode === 'focus' ? 'default' : 'secondary'} className="text-lg px-4 py-1">
              {timerMode === 'focus' ? 'Focus' : 'Break'}
            </Badge>
            <div className="text-6xl font-bold">{formatTime(timeLeft)}</div>
            <Progress value={progressPercentage} className="w-full h-3" />
             <div className="flex flex-col items-center w-full gap-3 pt-2">
                <div className="flex items-center justify-center w-full gap-3">
                    <Button onClick={handleStartPause} size="default" className="flex-1">
                    {isActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                    {isActive ? 'Pause' : 'Start'}
                    </Button>
                    <Button onClick={handleReset} variant="outline" size="default" className="flex-1">
                    <RotateCcw className="mr-2" /> Reset
                    </Button>
                </div>
                <Button onClick={toggleFullScreen} variant="outline" size="default" title={isFullScreen ? "Exit Fullscreen Focus" : "Enter Fullscreen Focus"} className="w-full mt-2">
                    {isFullScreen ? <Minimize className="mr-2" /> : <Maximize className="mr-2" />}
                    {isFullScreen ? "Exit Fullscreen" : "Fullscreen Focus"}
                </Button>
            </div>
            <details className="w-full pt-4 group">
                <summary className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-secondary">
                    <span className="text-sm font-medium">Timer Settings</span>
                    <Settings2 className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                </summary>
                <div className="p-3 mt-2 space-y-3 border rounded-md">
                    <div className="flex items-center gap-2">
                        <label htmlFor="focusDuration" className="text-sm min-w-[100px]">Focus (min):</label>
                        <Input id="focusDuration" type="number" value={focusDuration} onChange={(e) => setFocusDuration(Math.max(1, parseInt(e.target.value) || FOCUS_DURATION_MIN))} className="w-20 h-8" disabled={isActive} />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="breakDuration" className="text-sm min-w-[100px]">Break (min):</label>
                        <Input id="breakDuration" type="number" value={breakDuration} onChange={(e) => setBreakDuration(Math.max(1, parseInt(e.target.value) || BREAK_DURATION_MIN))} className="w-20 h-8" disabled={isActive} />
                    </div>
                </div>
            </details>
          </CardContent>
        </Card>

        {/* Iframe Viewer Card */}
        <Card className={cn(
            "shadow-lg",
            isFocusedBrowserMaximized
              ? "fixed inset-2 sm:inset-4 z-30 flex flex-col bg-card border-2 border-primary shadow-2xl rounded-xl" 
              : "md:col-span-1" 
          )}>
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Link className="w-5 h-5 text-primary"/> Focused Browser</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsFocusedBrowserMaximized(!isFocusedBrowserMaximized)} title={isFocusedBrowserMaximized ? "Collapse Browser" : "Expand Browser"}>
                    {isFocusedBrowserMaximized ? <Shrink className="w-5 h-5" /> : <Expand className="w-5 h-5" />}
                </Button>
            </div>
            <CardDescription>Load whitelisted websites here to stay focused. Click a site from your whitelist to load it directly.</CardDescription>
          </CardHeader>
          <CardContent className={cn("pb-4", isFocusedBrowserMaximized && "flex-grow flex flex-col min-h-0")}>
            <div className="flex gap-2 mb-4">
              <Input
                type="url"
                value={iframeSrc}
                onChange={(e) => setIframeSrc(e.target.value)}
                placeholder="example.com or click from whitelist"
                className="flex-grow"
              />
              <Button onClick={handleLoadInIframe}><ExternalLink className="w-4 h-4 mr-2 sm:hidden lg:inline" />Load</Button>
            </div>
            <div className={cn(
                "w-full border rounded-md overflow-hidden bg-muted",
                isFocusedBrowserMaximized ? "flex-grow" : "h-[300px] md:h-[400px]"
              )}>
                {currentIframeUrl && currentIframeUrl !== 'about:blank' ? (
                    <iframe
                        ref={iframeRef}
                        src={currentIframeUrl}
                        title="Focused Content Viewer"
                        className="w-full h-full border-0"
                        sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-same-origin allow-scripts"
                        onError={handleIframeError}
                    />
                ) : (
                    <div className={cn(
                        "flex items-center justify-center w-full border-2 border-dashed rounded-md bg-muted/50",
                        isFocusedBrowserMaximized ? "h-full" : "h-[300px] md:h-[400px]"
                      )}>
                        <p className="text-muted-foreground">Enter a whitelisted URL above or click one from the list.</p>
                    </div>
                )}
            </div>
          </CardContent>
        </Card>

      </div>

      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-destructive" /> Site Blocked or Error
            </AlertDialogTitle>
            <AlertDialogDescription>
              {modalMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsModalOpen(false)}>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Guru Chatbot FAB and Panel */}
      <AnimatePresence>
        {isGuruPanelOpen && (
          <motion.div
            layout // Animate size changes
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-20 right-6 z-40" 
          >
            <Card className={cn(
                "shadow-xl flex flex-col bg-card transition-all duration-300 ease-in-out",
                isGuruPanelMaximized 
                  ? "w-[clamp(320px,60vw,700px)] h-[clamp(400px,70vh,800px)]" 
                  : "w-80 h-[500px]"
              )}>
              <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-primary" />
                  <CardTitle className="text-md">Ask Guru</CardTitle>
                </div>
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={toggleGuruPanelMaximize} className="w-7 h-7 mr-1" title={isGuruPanelMaximized ? "Minimize Chat" : "Expand Chat"}>
                    {isGuruPanelMaximized ? <Minimize className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={toggleGuruPanel} className="w-7 h-7">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-grow p-0 overflow-hidden min-h-0"> {/* Added min-h-0 */}
                {GURU_CHATBOT_EMBED_URL === "https://YOUR_GEMINI_CHAT_EMBED_URL_HERE" ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                        <GraduationCap className="w-16 h-16 mb-4 text-muted-foreground" />
                        <p className="font-semibold text-muted-foreground">Guru Chat Not Configured</p>
                        <p className="text-xs text-muted-foreground">
                            Please replace the placeholder URL in the code (FocusModePage.tsx) with a valid Gemini chat embed URL to enable this feature.
                        </p>
                    </div>
                ) : (
                    <iframe
                    src={GURU_CHATBOT_EMBED_URL}
                    title="Guru AI Chatbot"
                    className="w-full h-full border-0"
                    allow="microphone; camera; display-capture" 
                    />
                )}
              </CardContent>
              <CardFooter className="p-2 text-xs text-center border-t text-muted-foreground">
                Guru is an AI assistant. Responses may not always be accurate.
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={toggleGuruPanel}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg"
        size="icon"
        aria-label="Toggle Guru Chat"
      >
        {isGuruPanelOpen ? <X className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
      </Button>
    </motion.div>
  );
}

