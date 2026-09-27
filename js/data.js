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
      {key:'price', label:'Valor (R$)', type:'number', step:'0.01', row:'r3'},
    ]
  },
  weightEntry:{
    title:'Peso',
    fields:[
      {key:'date', label:'Data', type:'date', required:true, row:'r1'},
      {key:'weight', label:'Peso (kg)', type:'number', step:'0.01', required:true, row:'r1'},
      {key:'notes', label:'Observações', type:'text'},
    ]
  },
  foodPurchase:{
    title:'Compra de ração',
    fields:[
      {key:'purchaseDate', label:'Data da compra', type:'date', required:true, row:'r1'},
      {key:'brand', label:'Marca da ração', type:'text', required:true, row:'r1'},
      {key:'purchaseLocation', label:'Local da compra', type:'text', row:'r2'},
      {key:'kg', label:'Quantidade (kg)', type:'number', step:'0.1', row:'r2'},
      {key:'price', label:'Valor (R$)', type:'number', step:'0.01', row:'r3'},
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
  { id:'abelha', name:'Abelha', color:'#FBF3DE', size:'40px 70px', position:'0 0, 0 0, 20px 35px, 20px 35px', image:
    "linear-gradient(30deg, rgba(58,44,15,0.27) 12%, transparent 12.5%, transparent 87%, rgba(58,44,15,0.27) 87.5%), linear-gradient(150deg, rgba(58,44,15,0.27) 12%, transparent 12.5%, transparent 87%, rgba(58,44,15,0.27) 87.5%), linear-gradient(30deg, rgba(58,44,15,0.27) 12%, transparent 12.5%, transparent 87%, rgba(58,44,15,0.27) 87.5%), linear-gradient(150deg, rgba(58,44,15,0.27) 12%, transparent 12.5%, transparent 87%, rgba(58,44,15,0.27) 87.5%)" },
  { id:'cobra', name:'Cobra', color:'#EFF5F2', size:'34px 34px', position:'0 0', image:
    "radial-gradient(circle at 30% 30%, rgba(60,122,103,0.34) 8px, transparent 8px), radial-gradient(circle at 70% 70%, rgba(60,122,103,0.34) 8px, transparent 8px)" },
  { id:'contorno_bichinhos', name:'Contorno de bichinhos', color:'#5B8CA6', size:'120px 120px', position:'0 0', image:
    "url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22120%22%20height%3D%22120%22%3E%3Cg%20transform%3D%22translate%2814%2020%29%22%20fill%3D%22none%22%20stroke%3D%22%23BFE3EE%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%220%22%20cy%3D%220%22%20r%3D%229%22/%3E%3Cpath%20d%3D%22M-9%2C-4%20L-14%2C-12%20L-4%2C-8%20Z%22/%3E%3Cpath%20d%3D%22M9%2C-4%20L14%2C-12%20L4%2C-8%20Z%22/%3E%3Ccircle%20cx%3D%220%22%20cy%3D%221%22%20r%3D%221.3%22%20fill%3D%22%23BFE3EE%22/%3E%3C/g%3E%3Cg%20transform%3D%22translate%2878%2016%29%20rotate%28-20%29%22%20fill%3D%22none%22%20stroke%3D%22%23BFE3EE%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%22-9%22%20cy%3D%22-3%22%20r%3D%223.2%22/%3E%3Ccircle%20cx%3D%22-9%22%20cy%3D%223%22%20r%3D%223.2%22/%3E%3Ccircle%20cx%3D%229%22%20cy%3D%22-3%22%20r%3D%223.2%22/%3E%3Ccircle%20cx%3D%229%22%20cy%3D%223%22%20r%3D%223.2%22/%3E%3Cline%20x1%3D%22-8%22%20y1%3D%220%22%20x2%3D%228%22%20y2%3D%220%22/%3E%3C/g%3E%3Cg%20transform%3D%22translate%2820%2060%29%22%20fill%3D%22none%22%20stroke%3D%22%23BFE3EE%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M-10%2C0%20Q-4%2C-8%208%2C0%20Q-4%2C8%20-10%2C0%20Z%22/%3E%3Cpath%20d%3D%22M8%2C0%20L14%2C-5%20L14%2C5%20Z%22/%3E%3Ccircle%20cx%3D%22-6%22%20cy%3D%22-1%22%20r%3D%221%22%20fill%3D%22%23BFE3EE%22/%3E%3C/g%3E%3Cg%20transform%3D%22translate%2896%2055%29%22%20fill%3D%22none%22%20stroke%3D%22%23BFE3EE%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cellipse%20cx%3D%220%22%20cy%3D%227%22%20rx%3D%226.5%22%20ry%3D%224.5%22/%3E%3Ccircle%20cx%3D%22-7%22%20cy%3D%22-2%22%20r%3D%222.6%22/%3E%3Ccircle%20cx%3D%22-2.5%22%20cy%3D%22-6%22%20r%3D%222.6%22/%3E%3Ccircle%20cx%3D%222.5%22%20cy%3D%22-6%22%20r%3D%222.6%22/%3E%3Ccircle%20cx%3D%227%22%20cy%3D%22-2%22%20r%3D%222.6%22/%3E%3C/g%3E%3Cg%20transform%3D%22translate%2825%2096%29%22%20fill%3D%22none%22%20stroke%3D%22%23BFE3EE%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M-11%2C4%20L-11%2C12%20L11%2C12%20L11%2C4%20L0%2C-9%20Z%22/%3E%3Crect%20x%3D%22-3%22%20y%3D%224%22%20width%3D%226%22%20height%3D%228%22/%3E%3C/g%3E%3Cg%20transform%3D%22translate%2885%2092%29%22%20fill%3D%22none%22%20stroke%3D%22%23BFE3EE%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%220%22%20cy%3D%220%22%20r%3D%228%22/%3E%3Cpath%20d%3D%22M-8%2C0%20Q0%2C-6%208%2C0%22/%3E%3Cpath%20d%3D%22M-8%2C0%20Q0%2C6%208%2C0%22/%3E%3C/g%3E%3C/svg%3E')" },
  { id:'estrelinhas', name:'Estrelinhas (Céu)', color:'#F2F0FA', size:'60px 60px', position:'0 0', image:
    "radial-gradient(circle at 20% 20%, rgba(107,91,178,0.48) 2px, transparent 2px), radial-gradient(circle at 60% 10%, rgba(107,91,178,0.34) 1.5px, transparent 1.5px), radial-gradient(circle at 80% 45%, rgba(107,91,178,0.46) 2px, transparent 2px), radial-gradient(circle at 35% 65%, rgba(107,91,178,0.34) 1.5px, transparent 1.5px), radial-gradient(circle at 65% 80%, rgba(107,91,178,0.48) 2px, transparent 2px), radial-gradient(circle at 10% 85%, rgba(107,91,178,0.34) 1.5px, transparent 1.5px)" },
  { id:'flores', name:'Flores', color:'#FBEEF1', size:'70px 70px', position:'0 0', image:
    "radial-gradient(circle at 50% 50%, rgba(196,83,126,0.46) 3px, transparent 3px), radial-gradient(circle at 50% 34%, rgba(212,83,126,0.34) 6px, transparent 6px), radial-gradient(circle at 64% 42%, rgba(212,83,126,0.34) 6px, transparent 6px), radial-gradient(circle at 59% 60%, rgba(212,83,126,0.34) 6px, transparent 6px), radial-gradient(circle at 41% 60%, rgba(212,83,126,0.34) 6px, transparent 6px), radial-gradient(circle at 36% 42%, rgba(212,83,126,0.34) 6px, transparent 6px)" },
  { id:'folhagem', name:'Folhagem (Reino Animal)', color:'#F0F5EC', size:'90px 90px', position:'0 0', image:
    "radial-gradient(ellipse 8px 18px at 25% 30%, rgba(58,110,60,0.34) 60%, transparent 60%), radial-gradient(ellipse 8px 18px at 70% 60%, rgba(58,110,60,0.34) 60%, transparent 60%), radial-gradient(ellipse 18px 8px at 50% 85%, rgba(58,110,60,0.34) 60%, transparent 60%)" },
  { id:'girafa', name:'Girafa', color:'#F6EFE0', size:'110px 110px', position:'0 0', image:
    "radial-gradient(ellipse 26px 20px at 20% 30%, rgba(138,90,43,0.27) 60%, transparent 60%), radial-gradient(ellipse 22px 18px at 65% 65%, rgba(138,90,43,0.27) 60%, transparent 60%), radial-gradient(ellipse 20px 16px at 85% 20%, rgba(138,90,43,0.27) 60%, transparent 60%)" },
  { id:'leopardo', name:'Leopardo', color:'#F5EEDD', size:'50px 50px', position:'0 0', image:
    "radial-gradient(circle at 25% 25%, transparent 6px, rgba(58,42,18,0.27) 6px, transparent 9px), radial-gradient(circle at 65% 55%, transparent 5px, rgba(58,42,18,0.27) 5px, transparent 8px)" },
  { id:'onca', name:'Onça-pintada', color:'#F5EBD6', size:'62px 62px', position:'0 0', image:
    "radial-gradient(circle at 22% 28%, transparent 4px, rgba(101,67,33,0.42) 4px, rgba(101,67,33,0.42) 6.5px, transparent 6.5px), radial-gradient(circle at 22% 28%, rgba(196,142,74,0.3) 3px, transparent 3px), radial-gradient(circle at 58% 42%, transparent 3.5px, rgba(101,67,33,0.42) 3.5px, rgba(101,67,33,0.42) 5.5px, transparent 5.5px), radial-gradient(circle at 58% 42%, rgba(196,142,74,0.3) 2.5px, transparent 2.5px), radial-gradient(circle at 40% 72%, transparent 3.5px, rgba(101,67,33,0.42) 3.5px, rgba(101,67,33,0.42) 5.5px, transparent 5.5px), radial-gradient(circle at 40% 72%, rgba(196,142,74,0.3) 2.5px, transparent 2.5px), radial-gradient(circle at 78% 78%, transparent 4px, rgba(101,67,33,0.42) 4px, rgba(101,67,33,0.42) 6.5px, transparent 6.5px), radial-gradient(circle at 78% 78%, rgba(196,142,74,0.3) 3px, transparent 3px)" },
  { id:'ondas', name:'Ondas (Aquário)', color:'#EAF4F7', size:'50px 25px', position:'0 0', image:
    "radial-gradient(circle at 25% 100%, transparent 12px, rgba(58,130,168,0.38) 12px, rgba(58,130,168,0.38) 14px, transparent 14px), radial-gradient(circle at 75% 0%, transparent 12px, rgba(58,130,168,0.38) 12px, rgba(58,130,168,0.38) 14px, transparent 14px)" },
  { id:'ossos_petshop', name:'Ossos e patas (petshop)', color:'#3A4750', size:'120px 120px', position:'0 0', image:
    "url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22120%22%20height%3D%22120%22%3E%3Cg%20fill%3D%22%234FBDBA%22%20%3E%3Cellipse%20cx%3D%2220%22%20cy%3D%2233%22%20rx%3D%227%22%20ry%3D%225%22/%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2221%22%20r%3D%223%22/%3E%3Ccircle%20cx%3D%2217%22%20cy%3D%2216%22%20r%3D%223%22/%3E%3Ccircle%20cx%3D%2223%22%20cy%3D%2216%22%20r%3D%223%22/%3E%3Ccircle%20cx%3D%2228%22%20cy%3D%2221%22%20r%3D%223%22/%3E%3C/g%3E%3Cg%20transform%3D%22translate%2885%2020%29%20rotate%2820%29%22%20fill%3D%22%238FA3AE%22%3E%3Ccircle%20cx%3D%22-8.1%22%20cy%3D%22-2.7%22%20r%3D%222.88%22/%3E%3Ccircle%20cx%3D%22-8.1%22%20cy%3D%222.7%22%20r%3D%222.88%22/%3E%3Ccircle%20cx%3D%228.1%22%20cy%3D%22-2.7%22%20r%3D%222.88%22/%3E%3Ccircle%20cx%3D%228.1%22%20cy%3D%222.7%22%20r%3D%222.88%22/%3E%3Crect%20x%3D%22-8.1%22%20y%3D%22-2.25%22%20width%3D%2216.2%22%20height%3D%224.5%22/%3E%3C/g%3E%3Cg%20fill%3D%22%234FBDBA%22%20%3E%3Cellipse%20cx%3D%2290%22%20cy%3D%2282.6%22%20rx%3D%226.65%22%20ry%3D%224.75%22/%3E%3Ccircle%20cx%3D%2282.4%22%20cy%3D%2271.2%22%20r%3D%222.85%22/%3E%3Ccircle%20cx%3D%2287.15%22%20cy%3D%2266.45%22%20r%3D%222.85%22/%3E%3Ccircle%20cx%3D%2292.85%22%20cy%3D%2266.45%22%20r%3D%222.85%22/%3E%3Ccircle%20cx%3D%2297.6%22%20cy%3D%2271.2%22%20r%3D%222.85%22/%3E%3C/g%3E%3Cg%20transform%3D%22translate%2820%2085%29%20rotate%28-15%29%22%20fill%3D%22%238FA3AE%22%3E%3Ccircle%20cx%3D%22-7.65%22%20cy%3D%22-2.55%22%20r%3D%222.72%22/%3E%3Ccircle%20cx%3D%22-7.65%22%20cy%3D%222.55%22%20r%3D%222.72%22/%3E%3Ccircle%20cx%3D%227.65%22%20cy%3D%22-2.55%22%20r%3D%222.72%22/%3E%3Ccircle%20cx%3D%227.65%22%20cy%3D%222.55%22%20r%3D%222.72%22/%3E%3Crect%20x%3D%22-7.65%22%20y%3D%22-2.125%22%20width%3D%2215.3%22%20height%3D%224.25%22/%3E%3C/g%3E%3Cg%20transform%3D%22translate%2860%2055%29%20rotate%2855%29%22%20fill%3D%22%238FA3AE%22%3E%3Ccircle%20cx%3D%22-6.75%22%20cy%3D%22-2.25%22%20r%3D%222.4%22/%3E%3Ccircle%20cx%3D%22-6.75%22%20cy%3D%222.25%22%20r%3D%222.4%22/%3E%3Ccircle%20cx%3D%226.75%22%20cy%3D%22-2.25%22%20r%3D%222.4%22/%3E%3Ccircle%20cx%3D%226.75%22%20cy%3D%222.25%22%20r%3D%222.4%22/%3E%3Crect%20x%3D%22-6.75%22%20y%3D%22-1.875%22%20width%3D%2213.5%22%20height%3D%223.75%22/%3E%3C/g%3E%3Ccircle%20cx%3D%2255%22%20cy%3D%2215%22%20r%3D%222.2%22%20fill%3D%22%23C9D6DC%22/%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%2255%22%20r%3D%221.8%22%20fill%3D%22%23C9D6DC%22/%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2260%22%20r%3D%222%22%20fill%3D%22%23C9D6DC%22/%3E%3Ccircle%20cx%3D%22100%22%20cy%3D%22105%22%20r%3D%222.2%22%20fill%3D%22%23C9D6DC%22/%3E%3C/svg%3E')" },
  { id:'patas', name:'Patas (Zoológico)', color:'#F7F1E6', size:'70px 70px', position:'0 0', image:
    "radial-gradient(ellipse 11px 9px at 50% 68%, rgba(101,67,33,0.38) 60%, transparent 60%), radial-gradient(circle at 28% 32%, rgba(101,67,33,0.38) 5px, transparent 5px), radial-gradient(circle at 42% 18%, rgba(101,67,33,0.38) 5px, transparent 5px), radial-gradient(circle at 60% 18%, rgba(101,67,33,0.38) 5px, transparent 5px), radial-gradient(circle at 74% 32%, rgba(101,67,33,0.38) 5px, transparent 5px)" },
  { id:'patas_cosmicas', name:'Patas cósmicas', color:'#1B1B3A', size:'120px 120px', position:'0 0', image:
    "url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22120%22%20height%3D%22120%22%3E%3Cg%20fill%3D%22%238B5CF6%22%20%3E%3Cellipse%20cx%3D%2225%22%20cy%3D%2238.8%22%20rx%3D%227.7%22%20ry%3D%225.5%22/%3E%3Ccircle%20cx%3D%2216.2%22%20cy%3D%2225.6%22%20r%3D%223.3%22/%3E%3Ccircle%20cx%3D%2221.7%22%20cy%3D%2220.1%22%20r%3D%223.3%22/%3E%3Ccircle%20cx%3D%2228.3%22%20cy%3D%2220.1%22%20r%3D%223.3%22/%3E%3Ccircle%20cx%3D%2233.8%22%20cy%3D%2225.6%22%20r%3D%223.3%22/%3E%3C/g%3E%3Cg%20fill%3D%22%233B9AE1%22%20%3E%3Cellipse%20cx%3D%2285%22%20cy%3D%2231.6%22%20rx%3D%226.65%22%20ry%3D%224.75%22/%3E%3Ccircle%20cx%3D%2277.4%22%20cy%3D%2220.2%22%20r%3D%222.85%22/%3E%3Ccircle%20cx%3D%2282.15%22%20cy%3D%2215.45%22%20r%3D%222.85%22/%3E%3Ccircle%20cx%3D%2287.85%22%20cy%3D%2215.45%22%20r%3D%222.85%22/%3E%3Ccircle%20cx%3D%2292.6%22%20cy%3D%2220.2%22%20r%3D%222.85%22/%3E%3C/g%3E%3Cg%20fill%3D%22%232DD4BF%22%20%3E%3Cellipse%20cx%3D%2255%22%20cy%3D%2283%22%20rx%3D%227%22%20ry%3D%225%22/%3E%3Ccircle%20cx%3D%2247%22%20cy%3D%2271%22%20r%3D%223%22/%3E%3Ccircle%20cx%3D%2252%22%20cy%3D%2266%22%20r%3D%223%22/%3E%3Ccircle%20cx%3D%2258%22%20cy%3D%2266%22%20r%3D%223%22/%3E%3Ccircle%20cx%3D%2263%22%20cy%3D%2271%22%20r%3D%223%22/%3E%3C/g%3E%3Cg%20fill%3D%22%23C026D3%22%20%3E%3Cellipse%20cx%3D%2215%22%20cy%3D%22106.8%22%20rx%3D%225.95%22%20ry%3D%224.25%22/%3E%3Ccircle%20cx%3D%228.2%22%20cy%3D%2296.6%22%20r%3D%222.55%22/%3E%3Ccircle%20cx%3D%2212.45%22%20cy%3D%2292.35%22%20r%3D%222.55%22/%3E%3Ccircle%20cx%3D%2217.55%22%20cy%3D%2292.35%22%20r%3D%222.55%22/%3E%3Ccircle%20cx%3D%2221.8%22%20cy%3D%2296.6%22%20r%3D%222.55%22/%3E%3C/g%3E%3Cg%20fill%3D%22%233B9AE1%22%20%3E%3Cellipse%20cx%3D%22105%22%20cy%3D%2298%22%20rx%3D%227%22%20ry%3D%225%22/%3E%3Ccircle%20cx%3D%2297%22%20cy%3D%2286%22%20r%3D%223%22/%3E%3Ccircle%20cx%3D%22102%22%20cy%3D%2281%22%20r%3D%223%22/%3E%3Ccircle%20cx%3D%22108%22%20cy%3D%2281%22%20r%3D%223%22/%3E%3Ccircle%20cx%3D%22113%22%20cy%3D%2286%22%20r%3D%223%22/%3E%3C/g%3E%3Cpath%20d%3D%22M50%2C9%20L51.5%2C13.5%20L56%2C15%20L51.5%2C16.5%20L50%2C21%20L48.5%2C16.5%20L44%2C15%20L48.5%2C13.5%20Z%22%20fill%3D%22%23FFFFFF%22/%3E%3Cpath%20d%3D%22M100%2C50.2%20L101.2%2C53.8%20L104.8%2C55%20L101.2%2C56.2%20L100%2C59.8%20L98.8%2C56.2%20L95.2%2C55%20L98.8%2C53.8%20Z%22%20fill%3D%22%23FFD966%22/%3E%3Cpath%20d%3D%22M75%2C99.6%20L76.35%2C103.65%20L80.4%2C105%20L76.35%2C106.35%20L75%2C110.4%20L73.65%2C106.35%20L69.6%2C105%20L73.65%2C103.65%20Z%22%20fill%3D%22%23FFFFFF%22/%3E%3Cpath%20d%3D%22M10%2C55.8%20L11.05%2C58.95%20L14.2%2C60%20L11.05%2C61.05%20L10%2C64.2%20L8.95%2C61.05%20L5.8%2C60%20L8.95%2C58.95%20Z%22%20fill%3D%22%23FFD966%22/%3E%3C/svg%3E')" },
  { id:'patinhas_rosa', name:'Patinhas rosa', color:'#FCE4EE', size:'120px 120px', position:'0 0', image:
    "url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22120%22%20height%3D%22120%22%3E%3Cg%20fill%3D%22%23D8608F%22%20%3E%3Cellipse%20cx%3D%2220%22%20cy%3D%2233%22%20rx%3D%227%22%20ry%3D%225%22/%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2221%22%20r%3D%223%22/%3E%3Ccircle%20cx%3D%2217%22%20cy%3D%2216%22%20r%3D%223%22/%3E%3Ccircle%20cx%3D%2223%22%20cy%3D%2216%22%20r%3D%223%22/%3E%3Ccircle%20cx%3D%2228%22%20cy%3D%2221%22%20r%3D%223%22/%3E%3C/g%3E%3Cg%20stroke%3D%22%23D8608F%22%20stroke-width%3D%221.6%22%20fill%3D%22none%22%20%3E%3Cellipse%20cx%3D%2275%22%20cy%3D%2224.8%22%20rx%3D%225.95%22%20ry%3D%224.25%22/%3E%3Ccircle%20cx%3D%2268.2%22%20cy%3D%2214.6%22%20r%3D%222.55%22/%3E%3Ccircle%20cx%3D%2272.45%22%20cy%3D%2210.35%22%20r%3D%222.55%22/%3E%3Ccircle%20cx%3D%2277.55%22%20cy%3D%2210.35%22%20r%3D%222.55%22/%3E%3Ccircle%20cx%3D%2281.8%22%20cy%3D%2214.6%22%20r%3D%222.55%22/%3E%3C/g%3E%3Cg%20stroke%3D%22%23D8608F%22%20stroke-width%3D%221.6%22%20fill%3D%22none%22%20%3E%3Cellipse%20cx%3D%2250%22%20cy%3D%2272.6%22%20rx%3D%226.65%22%20ry%3D%224.75%22/%3E%3Ccircle%20cx%3D%2242.4%22%20cy%3D%2261.2%22%20r%3D%222.85%22/%3E%3Ccircle%20cx%3D%2247.15%22%20cy%3D%2256.45%22%20r%3D%222.85%22/%3E%3Ccircle%20cx%3D%2252.85%22%20cy%3D%2256.45%22%20r%3D%222.85%22/%3E%3Ccircle%20cx%3D%2257.6%22%20cy%3D%2261.2%22%20r%3D%222.85%22/%3E%3C/g%3E%3Cg%20fill%3D%22%23D8608F%22%20%3E%3Cellipse%20cx%3D%22100%22%20cy%3D%2267.2%22%20rx%3D%226.3%22%20ry%3D%224.5%22/%3E%3Ccircle%20cx%3D%2292.8%22%20cy%3D%2256.4%22%20r%3D%222.7%22/%3E%3Ccircle%20cx%3D%2297.3%22%20cy%3D%2251.9%22%20r%3D%222.7%22/%3E%3Ccircle%20cx%3D%22102.7%22%20cy%3D%2251.9%22%20r%3D%222.7%22/%3E%3Ccircle%20cx%3D%22107.2%22%20cy%3D%2256.4%22%20r%3D%222.7%22/%3E%3C/g%3E%3Cg%20stroke%3D%22%23D8608F%22%20stroke-width%3D%221.6%22%20fill%3D%22none%22%20%3E%3Cellipse%20cx%3D%2215%22%20cy%3D%22101.4%22%20rx%3D%225.6%22%20ry%3D%224%22/%3E%3Ccircle%20cx%3D%228.6%22%20cy%3D%2291.8%22%20r%3D%222.4%22/%3E%3Ccircle%20cx%3D%2212.6%22%20cy%3D%2287.8%22%20r%3D%222.4%22/%3E%3Ccircle%20cx%3D%2217.4%22%20cy%3D%2287.8%22%20r%3D%222.4%22/%3E%3Ccircle%20cx%3D%2221.4%22%20cy%3D%2291.8%22%20r%3D%222.4%22/%3E%3C/g%3E%3Cg%20fill%3D%22%23D8608F%22%20%3E%3Cellipse%20cx%3D%2280%22%20cy%3D%22107.2%22%20rx%3D%226.3%22%20ry%3D%224.5%22/%3E%3Ccircle%20cx%3D%2272.8%22%20cy%3D%2296.4%22%20r%3D%222.7%22/%3E%3Ccircle%20cx%3D%2277.3%22%20cy%3D%2291.9%22%20r%3D%222.7%22/%3E%3Ccircle%20cx%3D%2282.7%22%20cy%3D%2291.9%22%20r%3D%222.7%22/%3E%3Ccircle%20cx%3D%2287.2%22%20cy%3D%2296.4%22%20r%3D%222.7%22/%3E%3C/g%3E%3C/svg%3E')" },
  { id:'pavao_wall', name:'Pavão', color:'#EBF7F3', size:'54px 54px', position:'0 0', image:
    "radial-gradient(circle at 50% 50%, rgba(212,175,55,0.4) 2.5px, rgba(31,122,108,0.4) 2.5px, rgba(31,122,108,0.4) 8px, rgba(60,150,190,0.3) 8px, rgba(60,150,190,0.3) 9.5px, transparent 9.5px)" },
  { id:'pets_brinquedos', name:'Pets e brinquedos', color:'#FBF3DE', size:'140px 140px', position:'0 0', image:
    "url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22140%22%20height%3D%22140%22%3E%3Ctext%20x%3D%228%22%20y%3D%2228%22%20font-size%3D%2222%22%3E%F0%9F%90%95%3C/text%3E%3Ctext%20x%3D%2260%22%20y%3D%2220%22%20font-size%3D%2220%22%3E%F0%9F%A6%B4%3C/text%3E%3Ctext%20x%3D%22105%22%20y%3D%2232%22%20font-size%3D%2220%22%3E%F0%9F%90%88%3C/text%3E%3Ctext%20x%3D%2220%22%20y%3D%2272%22%20font-size%3D%2220%22%3E%F0%9F%90%9F%3C/text%3E%3Ctext%20x%3D%2272%22%20y%3D%2268%22%20font-size%3D%2220%22%3E%F0%9F%90%B0%3C/text%3E%3Ctext%20x%3D%225%22%20y%3D%22115%22%20font-size%3D%2218%22%3E%E2%9A%BD%3C/text%3E%3Ctext%20x%3D%22105%22%20y%3D%22110%22%20font-size%3D%2220%22%3E%F0%9F%90%A6%3C/text%3E%3Ctext%20x%3D%2255%22%20y%3D%22118%22%20font-size%3D%2218%22%3E%F0%9F%8F%A0%3C/text%3E%3C/svg%3E')" },
  { id:'rabiscos_pet', name:'Rabiscos de pet', color:'#F7F1E6', size:'130px 120px', position:'0 0', image:
    "url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22130%22%20height%3D%22120%22%3E%3Ctext%20x%3D%226%22%20y%3D%2226%22%20font-size%3D%2215%22%20font-family%3D%22Comic%20Sans%20MS%2C%20cursive%22%20font-weight%3D%22bold%22%20fill%3D%22%232A241C%22%20transform%3D%22rotate%28-8%206%2026%29%22%3ELOVE%3C/text%3E%3Ctext%20x%3D%2275%22%20y%3D%2220%22%20font-size%3D%2213%22%20font-family%3D%22Comic%20Sans%20MS%2C%20cursive%22%20font-weight%3D%22bold%22%20fill%3D%22%232A241C%22%20transform%3D%22rotate%286%2075%2020%29%22%3EPET%3C/text%3E%3Ctext%20x%3D%2210%22%20y%3D%2260%22%20font-size%3D%2218%22%3E%F0%9F%90%BE%3C/text%3E%3Ctext%20x%3D%2255%22%20y%3D%2262%22%20font-size%3D%2214%22%20font-family%3D%22Comic%20Sans%20MS%2C%20cursive%22%20font-weight%3D%22bold%22%20fill%3D%22%232A241C%22%20transform%3D%22rotate%28-5%2055%2062%29%22%3EDOG%3C/text%3E%3Ctext%20x%3D%2295%22%20y%3D%2270%22%20font-size%3D%2216%22%3E%F0%9F%90%BE%3C/text%3E%3Ctext%20x%3D%2215%22%20y%3D%22105%22%20font-size%3D%2213%22%20font-family%3D%22Comic%20Sans%20MS%2C%20cursive%22%20font-weight%3D%22bold%22%20fill%3D%22%232A241C%22%20transform%3D%22rotate%285%2015%20105%29%22%3ECAT%3C/text%3E%3Ctext%20x%3D%2280%22%20y%3D%22105%22%20font-size%3D%2217%22%3E%F0%9F%90%BE%3C/text%3E%3C/svg%3E')" },
  { id:'safari_bichinhos', name:'Safari com bichinhos', color:'#F6EFE0', size:'140px 140px', position:'0 0', image:
    "url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22140%22%20height%3D%22140%22%3E%3Ctext%20x%3D%2210%22%20y%3D%2232%22%20font-size%3D%2224%22%3E%F0%9F%A6%81%3C/text%3E%3Ctext%20x%3D%2265%22%20y%3D%2224%22%20font-size%3D%2222%22%3E%F0%9F%90%98%3C/text%3E%3Ctext%20x%3D%22108%22%20y%3D%2236%22%20font-size%3D%2222%22%3E%F0%9F%A6%92%3C/text%3E%3Ctext%20x%3D%2225%22%20y%3D%2278%22%20font-size%3D%2222%22%3E%F0%9F%90%92%3C/text%3E%3Ctext%20x%3D%2275%22%20y%3D%2272%22%20font-size%3D%2222%22%3E%F0%9F%90%AF%3C/text%3E%3Ctext%20x%3D%228%22%20y%3D%22118%22%20font-size%3D%2220%22%3E%F0%9F%A6%93%3C/text%3E%3Ctext%20x%3D%22110%22%20y%3D%22112%22%20font-size%3D%2218%22%3E%F0%9F%8C%BF%3C/text%3E%3C/svg%3E')" },
  { id:'tartaruga', name:'Tartaruga', color:'#EFF3EA', size:'44px 76px', position:'0 0, 0 0, 22px 38px, 22px 38px', image:
    "linear-gradient(30deg, rgba(45,63,39,0.30) 12%, transparent 12.5%, transparent 87%, rgba(45,63,39,0.30) 87.5%), linear-gradient(150deg, rgba(45,63,39,0.30) 12%, transparent 12.5%, transparent 87%, rgba(45,63,39,0.30) 87.5%), linear-gradient(30deg, rgba(45,63,39,0.30) 12%, transparent 12.5%, transparent 87%, rgba(45,63,39,0.30) 87.5%), linear-gradient(150deg, rgba(45,63,39,0.30) 12%, transparent 12.5%, transparent 87%, rgba(45,63,39,0.30) 87.5%)" },
  { id:'tigre', name:'Tigre', color:'#FCF1E3', size:'auto', position:'0 0', image:
    "repeating-linear-gradient(58deg, rgba(224,122,53,0.4) 0px, rgba(224,122,53,0.4) 18px, rgba(45,28,14,0.4) 18px, rgba(45,28,14,0.4) 24px, transparent 24px, transparent 34px)" },
  { id:'vaca', name:'Vaca', color:'#F8F6F0', size:'140px 140px', position:'0 0', image:
    "radial-gradient(ellipse 34px 26px at 22% 30%, rgba(34,30,24,0.25) 60%, transparent 60%), radial-gradient(ellipse 40px 28px at 68% 62%, rgba(34,30,24,0.25) 60%, transparent 60%)" },
  { id:'veterinaria', name:'Veterinária', color:'#EAF4F0', size:'140px 140px', position:'0 0', image:
    "url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22140%22%20height%3D%22140%22%3E%3Ctext%20x%3D%2210%22%20y%3D%2230%22%20font-size%3D%2222%22%3E%E2%9E%95%3C/text%3E%3Ctext%20x%3D%2260%22%20y%3D%2220%22%20font-size%3D%2220%22%3E%F0%9F%92%89%3C/text%3E%3Ctext%20x%3D%22105%22%20y%3D%2234%22%20font-size%3D%2220%22%3E%F0%9F%90%BE%3C/text%3E%3Ctext%20x%3D%2225%22%20y%3D%2270%22%20font-size%3D%2220%22%3E%F0%9F%A9%B9%3C/text%3E%3Ctext%20x%3D%2275%22%20y%3D%2265%22%20font-size%3D%2222%22%3E%F0%9F%90%B6%3C/text%3E%3Ctext%20x%3D%225%22%20y%3D%22110%22%20font-size%3D%2220%22%3E%F0%9F%92%8A%3C/text%3E%3Ctext%20x%3D%22110%22%20y%3D%22105%22%20font-size%3D%2220%22%3E%E2%9D%A4%EF%B8%8F%3C/text%3E%3Ctext%20x%3D%2255%22%20y%3D%22118%22%20font-size%3D%2218%22%3E%F0%9F%90%B1%3C/text%3E%3C/svg%3E')" },
  { id:'vet_contorno_azul', name:'Veterinária (contorno azul)', color:'#7DD0EE', size:'120px 120px', position:'0 0', image:
    "url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22120%22%20height%3D%22120%22%3E%3Cg%20transform%3D%22translate%2818%2022%29%22%20fill%3D%22none%22%20stroke%3D%22%23FFFFFF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M-3%2C-9%20L3%2C-9%20L3%2C-3%20L9%2C-3%20L9%2C3%20L3%2C3%20L3%2C9%20L-3%2C9%20L-3%2C3%20L-9%2C3%20L-9%2C-3%20L-3%2C-3%20Z%22/%3E%3C/g%3E%3Cg%20transform%3D%22translate%2885%2020%29%20rotate%2825%29%22%20fill%3D%22none%22%20stroke%3D%22%23FFFFFF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%22-3%22%20y%3D%22-14%22%20width%3D%226%22%20height%3D%2218%22%20rx%3D%221%22/%3E%3Cline%20x1%3D%220%22%20y1%3D%224%22%20x2%3D%220%22%20y2%3D%2214%22/%3E%3Cline%20x1%3D%22-4%22%20y1%3D%22-16%22%20x2%3D%224%22%20y2%3D%22-16%22/%3E%3Cline%20x1%3D%22-2%22%20y1%3D%22-10%22%20x2%3D%222%22%20y2%3D%22-10%22/%3E%3Cline%20x1%3D%22-2%22%20y1%3D%22-6%22%20x2%3D%222%22%20y2%3D%22-6%22/%3E%3C/g%3E%3Cg%20transform%3D%22translate%2822%2062%29%20rotate%28-15%29%22%20fill%3D%22none%22%20stroke%3D%22%23FFFFFF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%22-11%22%20y%3D%22-5%22%20width%3D%2222%22%20height%3D%2210%22%20rx%3D%225%22/%3E%3Ccircle%20cx%3D%22-4%22%20cy%3D%220%22%20r%3D%221%22%20fill%3D%22%23FFFFFF%22/%3E%3Ccircle%20cx%3D%224%22%20cy%3D%220%22%20r%3D%221%22%20fill%3D%22%23FFFFFF%22/%3E%3C/g%3E%3Cg%20transform%3D%22translate%2892%2068%29%22%20fill%3D%22none%22%20stroke%3D%22%23FFFFFF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2210%22%20r%3D%225%22/%3E%3Cpath%20d%3D%22M0%2C5%20Q0%2C-8%20-10%2C-8%20Q-16%2C-8%20-16%2C-14%22/%3E%3Cpath%20d%3D%22M-16%2C-14%20Q-16%2C-18%20-13%2C-18%22/%3E%3Cpath%20d%3D%22M-16%2C-14%20Q-16%2C-10%20-19%2C-10%22/%3E%3C/g%3E%3Cg%20transform%3D%22translate%2820%20100%29%22%20fill%3D%22none%22%20stroke%3D%22%23FFFFFF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cellipse%20cx%3D%220%22%20cy%3D%227%22%20rx%3D%226.5%22%20ry%3D%224.5%22/%3E%3Ccircle%20cx%3D%22-7%22%20cy%3D%22-2%22%20r%3D%222.6%22/%3E%3Ccircle%20cx%3D%22-2.5%22%20cy%3D%22-6%22%20r%3D%222.6%22/%3E%3Ccircle%20cx%3D%222.5%22%20cy%3D%22-6%22%20r%3D%222.6%22/%3E%3Ccircle%20cx%3D%227%22%20cy%3D%22-2%22%20r%3D%222.6%22/%3E%3C/g%3E%3Cg%20transform%3D%22translate%2888%20100%29%20rotate%28-20%29%22%20fill%3D%22none%22%20stroke%3D%22%23FFFFFF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%22-9%22%20cy%3D%22-3%22%20r%3D%223.2%22/%3E%3Ccircle%20cx%3D%22-9%22%20cy%3D%223%22%20r%3D%223.2%22/%3E%3Ccircle%20cx%3D%229%22%20cy%3D%22-3%22%20r%3D%223.2%22/%3E%3Ccircle%20cx%3D%229%22%20cy%3D%223%22%20r%3D%223.2%22/%3E%3Cline%20x1%3D%22-8%22%20y1%3D%220%22%20x2%3D%228%22%20y2%3D%220%22/%3E%3C/g%3E%3C/svg%3E')" },
  { id:'zebra', name:'Zebra', color:'#F7F6F3', size:'auto', position:'0 0', image:
    "repeating-linear-gradient(48deg, rgba(24,23,21,0.4) 0px, rgba(24,23,21,0.4) 10px, transparent 10px, transparent 22px, rgba(24,23,21,0.22) 22px, rgba(24,23,21,0.22) 26px, transparent 26px, transparent 40px)" },
];
