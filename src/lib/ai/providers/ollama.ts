export class OllamaProvider {
  name = 'ollama';
  async isAvailable() {
    return Boolean(process.env.OLLAMA_BASE_URL);
  }
  async healthCheck() {
    return Boolean(process.env.OLLAMA_BASE_URL);
  }
  async chat(prompt: string) {
    return { id: 'ollama-1', content: 'ollama response', model: 'llama' };
  }
  async *generateStream() {
    yield { delta: 'ollama' };
  }
}

export default OllamaProvider;
