/* ==========================================================
   Prontuário Pet — dados de configuração
   Ícones de espécie, campos de formulário (ENTITY_CONFIG),
   temas de cores, fontes e papéis de parede disponíveis
   ========================================================== */

const SPECIES_ICON = {
  'Cachorro':'🐕','Gato':'🐈','Ave':'🐦','Coelho':'🐇','Roedor':'🐹','Réptil':'🦎','Outro':'🐾'
};

const ENTITY_CONFIG = {
  animal: {
    title:'Animal',
    fields:[
      {key:'name', label:'Nome', type:'text', required:true},
      {key:'photo', label:'Foto', type:'image'},
      {key:'species', label:'Espécie', type:'select', options:Object.keys(SPECIES_ICON), required:true, row:'r1', sectionBefore:'Características'},
      {key:'breed', label:'Raça', type:'text', row:'r1'},
      {key:'birthDate', label:'Data de nascimento', type:'date', row:'r2'},
      {key:'sex', label:'Sexo', type:'select', options:['Macho','Fêmea'], row:'r2'},
      {key:'weight', label:'Peso (kg)', type:'number', step:'0.1', row:'r3'},
      {key:'castrado', label:'Castrado(a)', type:'checkbox', row:'r3'},
      {key:'color', label:'Cor / pelagem', type:'text', row:'r4'},
      {key:'microchip', label:'Nº do microchip', type:'text', row:'r4'},
      {key:'notes', label:'Observações gerais', type:'textarea', sectionBefore:'Observações'},
    ]
  },
  vaccine:{
    title:'Vacina',
    fields:[
      {key:'name', label:'Vacina', type:'text', required:true},
      {key:'dateApplied', label:'Data de aplicação', type:'date', required:true, row:'r1'},
      {key:'nextDue', label:'Próxima dose', type:'date', row:'r1'},
      {key:'lot', label:'Lote', type:'text', row:'r2'},
      {key:'price', label:'Valor (R$)', type:'number', step:'0.01', row:'r2'},
      {key:'vet', label:'Veterinário(a) / clínica', type:'text'},
      {key:'notes', label:'Observações', type:'textarea'},
    ]
  },
  medication:{
    title:'Medicação',
    fields:[
      {key:'name', label:'Medicamento', type:'text', required:true},
      {key:'dose', label:'Dose', type:'text', row:'r1'},
      {key:'frequency', label:'Frequência', type:'text', row:'r1'},
      {key:'startDate', label:'Início', type:'date', row:'r2'},
      {key:'endDate', label:'Término (se aplicável)', type:'date', row:'r2'},
      {key:'price', label:'Valor (R$)', type:'number', step:'0.01', row:'r3'},
      {key:'purchaseLocation', label:'Local da compra', type:'text', row:'r3'},
      {key:'notes', label:'Observações', type:'textarea'},
    ]
  },
  healthRecord:{
    title:'Registro de saúde',
    fields:[
      {key:'date', label:'Data', type:'date', required:true, row:'r1'},
      {key:'type', label:'Tipo', type:'select', options:['Consulta','Exame','Cirurgia','Emergência','Vermifugação','Outro'], required:true, row:'r1'},
      {key:'description', label:'Descrição', type:'textarea', required:true},
      {key:'weight', label:'Peso na ocasião (kg)', type:'number', step:'0.1', row:'r2'},
      {key:'vet', label:'Veterinário(a) / clínica', type:'text', row:'r2'},
    ]
  }
};

const COLOR_THEMES = [
  { id:'sapo', name:'Sapo', emoji:'🐸', vars:{
    '--paper':'#F7F5EF','--paper-card':'#FFFFFF','--ink':'#1F2E28','--ink-soft':'#5B6A63','--line':'#DCD5C4',
    '--forest':'#2D6A4F','--forest-dark':'#1F4D39','--forest-tint':'#E4EFE8',
    '--amber':'#C88A2E','--amber-tint':'#FBEED9','--rust':'#B34B3C','--rust-tint':'#F7E3DF' } },
  { id:'onca', name:'Onça-pintada', emoji:'🐆', vars:{
    '--paper':'#FAF3E6','--paper-card':'#FFFFFF','--ink':'#2E2115','--ink-soft':'#6B5A44','--line':'#E3D2B0',
    '--forest':'#8A5A2B','--forest-dark':'#6B4420','--forest-tint':'#F1E3C9',
    '--amber':'#C88A2E','--amber-tint':'#FBEED9','--rust':'#A8402C','--rust-tint':'#F3DCD4' } },
  { id:'zebra', name:'Zebra', emoji:'🦓', vars:{
    '--paper':'#F5F5F4','--paper-card':'#FFFFFF','--ink':'#1B1B1B','--ink-soft':'#5A5A5A','--line':'#D6D6D3',
    '--forest':'#232323','--forest-dark':'#000000','--forest-tint':'#E7E7E5',
    '--amber':'#8A8A85','--amber-tint':'#EDEDEA','--rust':'#B33A3A','--rust-tint':'#F3DEDE' } },
  { id:'flamingo', name:'Flamingo', emoji:'🦩', vars:{
    '--paper':'#FBF1EE','--paper-card':'#FFFFFF','--ink':'#3A2028','--ink-soft':'#7A5560','--line':'#F0D3D8',
    '--forest':'#D46A8A','--forest-dark':'#B14A6C','--forest-tint':'#FBE3EA',
    '--amber':'#E0A54E','--amber-tint':'#FBEED9','--rust':'#C1543F','--rust-tint':'#F6DDD6' } },
  { id:'arara', name:'Arara-azul', emoji:'🦜', vars:{
    '--paper':'#F2F6FA','--paper-card':'#FFFFFF','--ink':'#16232E','--ink-soft':'#4E6577','--line':'#CFDFEA',
    '--forest':'#2A6FB0','--forest-dark':'#1E5488','--forest-tint':'#DCEAF6',
    '--amber':'#D9A227','--amber-tint':'#FAEECB','--rust':'#C0472E','--rust-tint':'#F5DCD3' } },
  { id:'coruja', name:'Coruja', emoji:'🦉', vars:{
    '--paper':'#F6F1E7','--paper-card':'#FFFEFA','--ink':'#2B211A','--ink-soft':'#6A594A','--line':'#DFCFB6',
    '--forest':'#6B4226','--forest-dark':'#4E2F1B','--forest-tint':'#E9DCC9',
    '--amber':'#B8853A','--amber-tint':'#F2E2C4','--rust':'#9C4530','--rust-tint':'#EDD8CF' } },
  { id:'tigre', name:'Tigre', emoji:'🐯', vars:{
    '--paper':'#FBF0E6','--paper-card':'#FFFFFF','--ink':'#2A1B10','--ink-soft':'#6E4F38','--line':'#EAC9A4',
    '--forest':'#C1592B','--forest-dark':'#9A431E','--forest-tint':'#F6DCC6',
    '--amber':'#D8A028','--amber-tint':'#FAEBC7','--rust':'#8A1F14','--rust-tint':'#EDD2CC' } },
  { id:'pavao', name:'Pavão', emoji:'🦚', vars:{
    '--paper':'#EFF6F3','--paper-card':'#FFFFFF','--ink':'#132520','--ink-soft':'#456A60','--line':'#CBE3DA',
    '--forest':'#1F7A6C','--forest-dark':'#155A4F','--forest-tint':'#D9EEE8',
    '--amber':'#C9A227','--amber-tint':'#F7EDC6','--rust':'#B34B3C','--rust-tint':'#F3DCD4' } },
  { id:'lobo', name:'Lobo-cinzento', emoji:'🐺', vars:{
    '--paper':'#F2F3F4','--paper-card':'#FFFFFF','--ink':'#20262B','--ink-soft':'#57646F','--line':'#D6DBDF',
    '--forest':'#4A5A6A','--forest-dark':'#333F4B','--forest-tint':'#E2E7EB',
    '--amber':'#C1954A','--amber-tint':'#F4E9D3','--rust':'#B0473A','--rust-tint':'#F1DAD5' } },
  { id:'raposa', name:'Raposa', emoji:'🦊', vars:{
    '--paper':'#FBF1E8','--paper-card':'#FFFEFB','--ink':'#33201A','--ink-soft':'#7A5544','--line':'#EACBB3',
    '--forest':'#B5563D','--forest-dark':'#8E3F2A','--forest-tint':'#F3DCCE',
    '--amber':'#D19A3D','--amber-tint':'#F8E9CB','--rust':'#8E2F22','--rust-tint':'#EAD1CB' } },
];

const FONTS = [
  { id:'classico', name:'Clássico', display:"'Fraunces', serif", body:"'Inter', sans-serif" },
  { id:'moderno', name:'Moderno', display:"'Poppins', sans-serif", body:"'Poppins', sans-serif" },
  { id:'editorial', name:'Editorial', display:"'Playfair Display', serif", body:"'Lora', serif" },
  { id:'amigavel', name:'Amigável', display:"'Quicksand', sans-serif", body:"'Quicksand', sans-serif" },
  { id:'suave', name:'Suave', display:"'Nunito', sans-serif", body:"'Nunito', sans-serif" },
  { id:'arredondado', name:'Arredondado', display:"'Comfortaa', sans-serif", body:"'Nunito', sans-serif" },
  { id:'manuscrito', name:'Manuscrito', display:"'Caveat', cursive", body:"'Inter', sans-serif" },
  { id:'divertido', name:'Divertido', display:"'Baloo 2', sans-serif", body:"'Baloo 2', sans-serif" },
  { id:'tecnico', name:'Técnico', display:"'Space Grotesk', sans-serif", body:"'Space Grotesk', sans-serif" },
  { id:'tradicional', name:'Tradicional', display:"'Merriweather', serif", body:"'Merriweather', serif" },
];

const WALLPAPERS = [
  { id:'none', name:'Nenhum', color:'var(--paper)', image:'none', size:'auto', position:'0 0' },
  { id:'onca', name:'Onça-pintada', color:'#F7F0E0', size:'60px 60px', position:'0 0', image:
    "radial-gradient(circle at 22% 28%, rgba(138,90,43,0.16) 5px, transparent 5px), radial-gradient(circle at 58% 42%, rgba(138,90,43,0.16) 4px, transparent 4px), radial-gradient(circle at 40% 72%, rgba(138,90,43,0.16) 4px, transparent 4px), radial-gradient(circle at 78% 78%, rgba(138,90,43,0.16) 5px, transparent 5px)" },
  { id:'leopardo', name:'Leopardo', color:'#F5EEDD', size:'50px 50px', position:'0 0', image:
    "radial-gradient(circle at 25% 25%, transparent 6px, rgba(58,42,18,0.14) 6px, transparent 9px), radial-gradient(circle at 65% 55%, transparent 5px, rgba(58,42,18,0.14) 5px, transparent 8px)" },
  { id:'zebra', name:'Zebra', color:'#F5F4F0', size:'auto', position:'0 0', image:
    "repeating-linear-gradient(48deg, rgba(32,31,29,0.12) 0px, rgba(32,31,29,0.12) 12px, transparent 12px, transparent 24px)" },
  { id:'tigre', name:'Tigre', color:'#FBF0E6', size:'auto', position:'0 0', image:
    "repeating-linear-gradient(58deg, rgba(224,122,53,0.18) 0px, rgba(224,122,53,0.18) 22px, transparent 22px, transparent 30px)" },
  { id:'girafa', name:'Girafa', color:'#F6EFE0', size:'110px 110px', position:'0 0', image:
    "radial-gradient(ellipse 26px 20px at 20% 30%, rgba(138,90,43,0.14) 60%, transparent 60%), radial-gradient(ellipse 22px 18px at 65% 65%, rgba(138,90,43,0.14) 60%, transparent 60%), radial-gradient(ellipse 20px 16px at 85% 20%, rgba(138,90,43,0.14) 60%, transparent 60%)" },
  { id:'vaca', name:'Vaca', color:'#F8F6F0', size:'140px 140px', position:'0 0', image:
    "radial-gradient(ellipse 34px 26px at 22% 30%, rgba(34,30,24,0.13) 60%, transparent 60%), radial-gradient(ellipse 40px 28px at 68% 62%, rgba(34,30,24,0.13) 60%, transparent 60%)" },
  { id:'cobra', name:'Cobra', color:'#EFF5F2', size:'34px 34px', position:'0 0', image:
    "radial-gradient(circle at 30% 30%, rgba(60,122,103,0.18) 8px, transparent 8px), radial-gradient(circle at 70% 70%, rgba(60,122,103,0.18) 8px, transparent 8px)" },
  { id:'pavao_wall', name:'Pavão', color:'#EEF6F3', size:'50px 50px', position:'0 0', image:
    "radial-gradient(circle at 50% 50%, rgba(31,122,108,0.16) 8px, transparent 8px)" },
  { id:'abelha', name:'Abelha', color:'#FBF3DE', size:'40px 70px', position:'0 0, 0 0, 20px 35px, 20px 35px', image:
    "linear-gradient(30deg, rgba(58,44,15,0.14) 12%, transparent 12.5%, transparent 87%, rgba(58,44,15,0.14) 87.5%), linear-gradient(150deg, rgba(58,44,15,0.14) 12%, transparent 12.5%, transparent 87%, rgba(58,44,15,0.14) 87.5%), linear-gradient(30deg, rgba(58,44,15,0.14) 12%, transparent 12.5%, transparent 87%, rgba(58,44,15,0.14) 87.5%), linear-gradient(150deg, rgba(58,44,15,0.14) 12%, transparent 12.5%, transparent 87%, rgba(58,44,15,0.14) 87.5%)" },
  { id:'tartaruga', name:'Tartaruga', color:'#EFF3EA', size:'44px 76px', position:'0 0, 0 0, 22px 38px, 22px 38px', image:
    "linear-gradient(30deg, rgba(45,63,39,0.16) 12%, transparent 12.5%, transparent 87%, rgba(45,63,39,0.16) 87.5%), linear-gradient(150deg, rgba(45,63,39,0.16) 12%, transparent 12.5%, transparent 87%, rgba(45,63,39,0.16) 87.5%), linear-gradient(30deg, rgba(45,63,39,0.16) 12%, transparent 12.5%, transparent 87%, rgba(45,63,39,0.16) 87.5%), linear-gradient(150deg, rgba(45,63,39,0.16) 12%, transparent 12.5%, transparent 87%, rgba(45,63,39,0.16) 87.5%)" },
  { id:'flores', name:'Flores', color:'#FBEEF1', size:'70px 70px', position:'0 0', image:
    "radial-gradient(circle at 50% 50%, rgba(196,83,126,0.24) 3px, transparent 3px), radial-gradient(circle at 50% 34%, rgba(212,83,126,0.18) 6px, transparent 6px), radial-gradient(circle at 64% 42%, rgba(212,83,126,0.18) 6px, transparent 6px), radial-gradient(circle at 59% 60%, rgba(212,83,126,0.18) 6px, transparent 6px), radial-gradient(circle at 41% 60%, rgba(212,83,126,0.18) 6px, transparent 6px), radial-gradient(circle at 36% 42%, rgba(212,83,126,0.18) 6px, transparent 6px)" },
  { id:'patas', name:'Patas (Zoológico)', color:'#F7F1E6', size:'70px 70px', position:'0 0', image:
    "radial-gradient(ellipse 11px 9px at 50% 68%, rgba(101,67,33,0.2) 60%, transparent 60%), radial-gradient(circle at 28% 32%, rgba(101,67,33,0.2) 5px, transparent 5px), radial-gradient(circle at 42% 18%, rgba(101,67,33,0.2) 5px, transparent 5px), radial-gradient(circle at 60% 18%, rgba(101,67,33,0.2) 5px, transparent 5px), radial-gradient(circle at 74% 32%, rgba(101,67,33,0.2) 5px, transparent 5px)" },
  { id:'folhagem', name:'Folhagem (Reino Animal)', color:'#F0F5EC', size:'90px 90px', position:'0 0', image:
    "radial-gradient(ellipse 8px 18px at 25% 30%, rgba(58,110,60,0.18) 60%, transparent 60%), radial-gradient(ellipse 8px 18px at 70% 60%, rgba(58,110,60,0.18) 60%, transparent 60%), radial-gradient(ellipse 18px 8px at 50% 85%, rgba(58,110,60,0.18) 60%, transparent 60%)" },
  { id:'ondas', name:'Ondas (Aquário)', color:'#EAF4F7', size:'50px 25px', position:'0 0', image:
    "radial-gradient(circle at 25% 100%, transparent 12px, rgba(58,130,168,0.2) 12px, rgba(58,130,168,0.2) 14px, transparent 14px), radial-gradient(circle at 75% 0%, transparent 12px, rgba(58,130,168,0.2) 12px, rgba(58,130,168,0.2) 14px, transparent 14px)" },
  { id:'estrelinhas', name:'Estrelinhas (Céu)', color:'#F2F0FA', size:'60px 60px', position:'0 0', image:
    "radial-gradient(circle at 20% 20%, rgba(107,91,178,0.26) 2px, transparent 2px), radial-gradient(circle at 60% 10%, rgba(107,91,178,0.18) 1.5px, transparent 1.5px), radial-gradient(circle at 80% 45%, rgba(107,91,178,0.24) 2px, transparent 2px), radial-gradient(circle at 35% 65%, rgba(107,91,178,0.18) 1.5px, transparent 1.5px), radial-gradient(circle at 65% 80%, rgba(107,91,178,0.26) 2px, transparent 2px), radial-gradient(circle at 10% 85%, rgba(107,91,178,0.18) 1.5px, transparent 1.5px)" },
];
