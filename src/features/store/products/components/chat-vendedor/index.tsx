// ==========================================
// COMPONENTE: ChatVendedor
// ==========================================
// Responsabilidade: Mostrar bloco de chat com vendedor
// O que faz: Exibe ícone de chat, status de conexão, nome do vendedor e botão para iniciar conversa
// Recebe: Nome do vendedor, status de conexão, tempo de resposta, callback de clique
// Estados: Nenhum (componente visual simples)

'use client'; // Pode ser client se quiser adicionar interações depois

// ==========================================
// TIPO DO STATUS DE CONEXÃO
// Define as opções possíveis de status
// ==========================================
type StatusConexao = 'online' | 'offline' | 'ausente';

// ==========================================
// INTERFACE DAS PROPS
// ==========================================
interface ChatVendedorProps {
  vendedorNome?: string;      // Nome do vendedor (ex: "Sport Elite Store")
  status?: StatusConexao;     // Status: 'online', 'offline' ou 'ausente'
  tempoResposta?: string;     // Texto de tempo (ex: "Responde em minutos")
  onClick?: () => void;       // Função chamada ao clicar no botão Chat
}

// ==========================================
// CONFIGURAÇÃO DOS STATUS
// Objeto que define cores e textos para cada status
// ==========================================
const statusConfig = {
  online: {
    corBolinha: 'bg-success',           // Verde
    corTexto: 'text-success-dark',      // Verde escuro
    iconeStatus: '●',                    // Círculo cheio
  },
  offline: {
    corBolinha: 'bg-text-hint',         // Cinza
    corTexto: 'text-text-muted',        // Cinza médio
    iconeStatus: '○',                    // Círculo vazio
  },
  ausente: {
    corBolinha: 'bg-accent',            // Laranja/Âmbar
    corTexto: 'text-accent-dark',       // Laranja escuro
    iconeStatus: '◐',                    // Círculo metade
  },
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function ChatVendedor({
  vendedorNome = 'o vendedor',    // Valor padrão se não passar nada
  status = 'online',               // Valor padrão: online
  tempoResposta = 'Responde em minutos',
  onClick,
}: ChatVendedorProps) {
  
  // Pega as configurações visuais baseadas no status atual
  const config = statusConfig[status];

  return (
    // Container principal
    // flex: layout em linha (horizontal)
    // items-center: alinha verticalmente ao centro
    // gap-3: espaçamento de 12px entre elementos
    // p-3: padding interno de 12px
    // bg-primary-light: fundo azul claro
    // border: borda cinza
    // border-surface-border: cor da borda
    // rounded-xl: cantos arredondados (12px)
    <div className="flex items-center gap-3 p-3 bg-primary-light border border-surface-border rounded-xl">
      
      {/* -----------------------------------------
          ÍCONE DE CHAT COM STATUS
          ----------------------------------------- */}
      {/* relative: permite posicionar a bolinha de status absolutamente */}
      <div className="relative">
        {/* Quadrado azul com ícone de chat */}
        {/* w-[34px] h-[34px]: tamanho fixo 34x34px */}
        {/* bg-primary: cor azul principal */}
        {/* rounded-lg: cantos arredondados */}
        {/* flex items-center justify-center: centraliza o emoji */}
        {/* text-sm: tamanho do emoji */}
        <div className="w-[34px] h-[34px] bg-primary rounded-lg flex items-center justify-center text-sm">
          💬
        </div>
        
        {/* Bolinha de status (online/offline/ausente) */}
        {/* absolute: posiciona em relação ao relative acima */}
        {/* -bottom-0.5: metade para fora embaixo (overlap) */}
        {/* -right-0.5: metade para fora na direita (overlap) */}
        {/* w-2.5 h-2.5: tamanho 10px */}
        {/* rounded-full: formato circular */}
        {/* border-2: borda de 2px */}
        {/* border-primary-light: cor da borda igual ao fundo (efeito de separação) */}
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${config.corBolinha} rounded-full border-2 border-primary-light`} />
      </div>
      
      {/* -----------------------------------------
          TEXTOS (NOME E STATUS)
          ----------------------------------------- */}
      {/* flex-1: ocupa todo espaço disponível */}
      <div className="flex-1">
        {/* Título: "Falar com o vendedor" */}
        {/* text-[13px]: tamanho de fonte 13px */}
        {/* font-semibold: peso 600 (semi-negrito) */}
        {/* text-text-primary: cor escura do texto */}
        <div className="text-[13px] font-semibold text-text-primary">
          Falar com {vendedorNome}
        </div>
        
        {/* Status e tempo de resposta */}
        {/* text-[11px]: tamanho pequeno 11px */}
        {/* config.corTexto: cor dinâmica baseada no status */}
        {/* font-medium: peso 500 */}
        <div className={`text-[11px] ${config.corTexto} font-medium`}>
          {config.iconeStatus} {status === 'online' ? 'Online agora' : status === 'offline' ? 'Offline' : 'Ausente'} · {tempoResposta}
        </div>
      </div>
      
      {/* -----------------------------------------
          BOTÃO CHAT
          ----------------------------------------- */}
      {/* bg-transparent: fundo transparente */}
      {/* border-[1.5px]: borda de 1.5px */}
      {/* border-primary: cor azul da borda */}
      {/* rounded-lg: cantos arredondados */}
      {/* px-3: padding horizontal 12px */}
      {/* py-1.5: padding vertical 6px */}
      {/* text-xs: fonte pequena 12px */}
      {/* font-bold: peso 700 (negrito) */}
      {/* text-primary: cor azul do texto */}
      {/* hover:bg-primary: ao passar mouse, fundo fica azul */}
      {/* hover:text-white: ao passar mouse, texto fica branco */}
      {/* transition-colors: animação suave de cores */}
      <button 
        onClick={onClick}
        className="bg-transparent border-[1.5px] border-primary rounded-lg px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-colors"
      >
        Chat
      </button>
    </div>
  );
}