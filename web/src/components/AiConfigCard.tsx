import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { AiConfig } from '@/types';

const providerModels: Record<string, string[]> = {
  'openai-compatible': ['gpt-4.1-mini'],
  openai: ['gpt-4.1-mini'],
  deepseek: ['deepseek-v4-flash', 'deepseek-v4-pro'],
  kimi: ['kimi-k2.7-code'],
  zhipu: ['glm-5.1'],
  siliconflow: ['Qwen/Qwen3-Coder-480B-A35B-Instruct'],
  openrouter: ['anthropic/claude-sonnet-4.5'],
  ollama: ['qwen2.5-coder:7b']
};

export function AiConfigCard({
  config,
  loading,
  onChange,
  onSave
}: {
  config: AiConfig;
  loading: string;
  onChange: (config: AiConfig) => void;
  onSave: () => void;
}) {
  return <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-sm"><KeyRound size={16} />AI 配置</CardTitle>
      <CardDescription>使用 AI SDK provider 调用模型。</CardDescription>
    </CardHeader>
    <CardContent className="space-y-2">
      <Select value={config.provider} onChange={(event) => onChange({ ...config, provider: event.target.value })}>
        <option value="openai-compatible">OpenAI Compatible</option>
        <option value="openai">OpenAI</option>
        <option value="deepseek">DeepSeek</option>
        <option value="kimi">Kimi</option>
        <option value="zhipu">智谱 GLM</option>
        <option value="siliconflow">SiliconFlow</option>
        <option value="openrouter">OpenRouter</option>
        <option value="ollama">Ollama</option>
        <option value="custom">自定义提供商</option>
      </Select>
      <Input value={config.baseURL} onChange={(event) => onChange({ ...config, baseURL: event.target.value })} placeholder="Base URL" />
      {config.provider === 'custom'
        ? <Input name="pfo-model-inline" value={config.model} autoComplete="off" onChange={(event) => onChange({ ...config, model: event.target.value })} placeholder="Model" />
        : <Select name="pfo-model-inline" value={config.model} autoComplete="off" onChange={(event) => onChange({ ...config, model: event.target.value })}>
          {modelOptions(config.provider, config.model).map((model) => <option key={model} value={model}>{model}</option>)}
        </Select>}
      <Input name="pfo-api-key-inline" value={config.apiKey} autoComplete="off" spellCheck={false} className="[-webkit-text-security:disc]" onChange={(event) => onChange({ ...config, apiKey: event.target.value })} placeholder="API Key" type="text" />
      <Button size="sm" variant="secondary" onClick={onSave} disabled={!!loading}>保存配置</Button>
    </CardContent>
  </Card>;
}

function modelOptions(provider: string, currentModel: string) {
  const options = providerModels[provider] || providerModels['openai-compatible'];
  return currentModel && !options.includes(currentModel) ? [currentModel, ...options] : options;
}
