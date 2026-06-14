export class AnthropicProvider {
  name = 'anthropic';
  async isAvailable() {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }
  async healthCheck() {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }
  async chat(prompt: string) {
    return { id: 'anthropic-1', content: 'anthropic response', model: 'claude' };
  }
  async *generateStream() {
    yield { delta: 'anthropic' };
  }
}

export default AnthropicProvider;
