import { useState, useRef, useCallback } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UseChatStreamOptions {
  provider?: string;
  maxRetries?: number;
}

export function useChatStream(options: UseChatStreamOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const maxRetries = options.maxRetries ?? 2;

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const appendMessage = useCallback(
    async (prompt: string) => {
      const userMessage: Message = { id: Date.now().toString(), role: 'user', content: prompt };
      const assistantMessageId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantMessageId, role: 'assistant', content: '' },
      ]);
      setIsLoading(true);
      setError(null);

      let retryCount = 0;

      const executeStream = async (): Promise<void> => {
        abortControllerRef.current = new AbortController();
        let streamStarted = false;

        try {
          const response = await fetch('/api/ai/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, provider: options.provider }),
            signal: abortControllerRef.current.signal,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          if (!response.body) {
            throw new Error('No response body returned');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';
          let accumulatedContent = '';

          // Throttled UI update to prevent excessive re-renders
          let updatePending = false;
          const flushUpdate = () => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId ? { ...msg, content: accumulatedContent } : msg
              )
            );
            updatePending = false;
          };

          let isDone = false;
          while (!isDone) {
            const { value, done } = await reader.read();
            if (done) {
              isDone = true;
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine || trimmedLine.startsWith(':')) continue;

              if (trimmedLine.startsWith('event: error')) {
                // Expected next line is data: ...
                continue; // We'll handle the data line next
              }

              if (trimmedLine.startsWith('data: ')) {
                streamStarted = true; // Once we get data, we lock it in
                const dataStr = trimmedLine.slice(6);

                if (dataStr === '[DONE]') {
                  flushUpdate();
                  isDone = true;
                  return; // Normal exit
                }

                try {
                  const data = JSON.parse(dataStr);
                  if (data.message) {
                    // This is an error event payload
                    throw new Error(data.message);
                  }
                  if (data.content) {
                    accumulatedContent += data.content;
                    if (!updatePending) {
                      updatePending = true;
                      requestAnimationFrame(flushUpdate);
                    }
                  }
                } catch (_e) {
                  // Parse error, ignore incomplete chunks
                }
              }
            }
          }

          // Final flush if any
          if (updatePending) flushUpdate();
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            console.log('Stream aborted by user');
            return;
          }

          if (!streamStarted && retryCount < maxRetries) {
            retryCount++;
            console.warn(`Stream failed, retrying... (${retryCount}/${maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
            return executeStream();
          }

          const errMsg = err instanceof Error ? err.message : String(err);
          setError(errMsg);

          // Append error to UI
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + `\n\n[Error: ${errMsg}]` }
                : msg
            )
          );
        } finally {
          setIsLoading(false);
        }
      };

      await executeStream();
    },
    [options.provider, maxRetries]
  );

  return { messages, isLoading, error, appendMessage, stopGeneration };
}
