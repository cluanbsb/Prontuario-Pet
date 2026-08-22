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
      {key:'species', label:'Espécie', type:'select', options:Object.keys(SPECIES_ICON), required:true},
      {key:'breed', label:'Raça', type:'text'},
      {key:'birthDate', label:'Data de nascimento', type:'date'},
      {key:'sex', label:'Sexo', type:'select', options:['Macho','Fêmea']},
      {key:'weight', label:'Peso (kg)', type:'number', step:'0.1'},
      {key:'castrado', label:'Castrado(a)', type:'checkbox'},
      {key:'color', label:'Cor / pelagem', type:'text'},
      {key:'microchip', label:'Nº do microchip', type:'text'},
      {key:'notes', label:'Observações gerais', type:'textarea'},
    ]
  },
  vaccine:{
    title:'Vacina',
    fields:[
      {key:'name', label:'Vacina', type:'text', required:true},
      {key:'dateApplied', label:'Data de aplicação', type:'date', required:true},
      {key:'nextDue', label:'Próxima dose', type:'date'},
      {key:'lot', label:'Lote', type:'text'},
      {key:'price', label:'Valor (R$)', type:'number', step:'0.01'},
      {key:'vet', label:'Veterinário(a) / clínica', type:'text'},
      {key:'notes', label:'Observações', type:'textarea'},
    ]
  },
  medication:{
    title:'Medicação',
    fields:[
      {key:'name', label:'Medicamento', type:'text', required:true},
      {key:'dose', label:'Dose', type:'text'},
      {key:'frequency', label:'Frequência', type:'text'},
      {key:'startDate', label:'Início', type:'date'},
      {key:'endDate', label:'Término (se aplicável)', type:'date'},
      {key:'price', label:'Valor (R$)', type:'number', step:'0.01'},
      {key:'purchaseLocation', label:'Local da compra', type:'text'},
      {key:'notes', label:'Observações', type:'textarea'},
    ]
  },
  healthRecord:{
    title:'Registro de saúde',
    fields:[
      {key:'date', label:'Data', type:'date', required:true},
      {key:'type', label:'Tipo', type:'select', options:['Consulta','Exame','Cirurgia','Emergência','Vermifugação','Outro'], required:true},
      {key:'description', label:'Descrição', type:'textarea', required:true},
      {key:'weight', label:'Peso na ocasião (kg)', type:'number', step:'0.1'},
      {key:'vet', label:'Veterinário(a) / clínica', type:'text'},
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
  { id:'none', name:'Nenhum', bg:'var(--paper)' },
  { id:'onca', name:'Onça-pintada', bg:
    "#e3b46a radial-gradient(circle at 22% 28%, #2b1c12 0 5px, transparent 6px) 0 0/60px 60px, radial-gradient(circle at 58% 42%, #2b1c12 0 4px, transparent 5px) 0 0/60px 60px, radial-gradient(circle at 40% 72%, #2b1c12 0 4px, transparent 5px) 0 0/60px 60px, radial-gradient(circle at 78% 78%, #2b1c12 0 5px, transparent 6px) 0 0/60px 60px" },
  { id:'leopardo', name:'Leopardo', bg:
    "#e9c477 radial-gradient(circle at 25% 25%, transparent 6px, #3a2a12 7px 9px, transparent 10px) 0 0/50px 50px, radial-gradient(circle at 65% 55%, transparent 5px, #3a2a12 6px 8px, transparent 9px) 0 0/50px 50px" },
  { id:'zebra', name:'Zebra', bg:
    "repeating-linear-gradient(48deg, #201f1d 0 12px, #f4f1e6 12px 24px)" },
  { id:'tigre', name:'Tigre', bg:
    "repeating-linear-gradient(58deg, #e07a35 0 22px, #1c1207 22px 30px)" },
  { id:'girafa', name:'Girafa', bg:
    "#f2e0be radial-gradient(ellipse 26px 20px at 20% 30%, #8a5a2b 60%, transparent 62%) 0 0/110px 110px, radial-gradient(ellipse 22px 18px at 65% 65%, #8a5a2b 60%, transparent 62%) 0 0/110px 110px, radial-gradient(ellipse 20px 16px at 85% 20%, #8a5a2b 60%, transparent 62%) 0 0/110px 110px" },
  { id:'vaca', name:'Vaca', bg:
    "#f6f3ea radial-gradient(ellipse 34px 26px at 22% 30%, #221e18 60%, transparent 62%) 0 0/140px 140px, radial-gradient(ellipse 40px 28px at 68% 62%, #221e18 60%, transparent 62%) 0 0/140px 140px" },
  { id:'cobra', name:'Cobra', bg:
    "#2f5d4f radial-gradient(circle at 50% 0, transparent 15px, #3c7a67 16px) 0 0/34px 34px, radial-gradient(circle at 50% 34px, transparent 15px, #2a4f43 16px) 0 0/34px 34px" },
  { id:'pavao_wall', name:'Pavão', bg:
    "#0f4c43 radial-gradient(circle, #1f7a6c 0 8px, transparent 9px 16px, #0a3b34 17px 20px, transparent 21px) 0 0/50px 50px" },
  { id:'abelha', name:'Abelha', bg:
    "#f6c453 linear-gradient(30deg, #3a2c0f 12%, transparent 12.5%, transparent 87%, #3a2c0f 87.5%) 0 0/40px 70px, linear-gradient(150deg, #3a2c0f 12%, transparent 12.5%, transparent 87%, #3a2c0f 87.5%) 0 0/40px 70px, linear-gradient(30deg, #3a2c0f 12%, transparent 12.5%, transparent 87%, #3a2c0f 87.5%) 20px 35px/40px 70px, linear-gradient(150deg, #3a2c0f 12%, transparent 12.5%, transparent 87%, #3a2c0f 87.5%) 20px 35px/40px 70px" },
  { id:'tartaruga', name:'Tartaruga', bg:
    "#4a6741 linear-gradient(30deg, #2d3f27 12%, transparent 12.5%, transparent 87%, #2d3f27 87.5%) 0 0/44px 76px, linear-gradient(150deg, #2d3f27 12%, transparent 12.5%, transparent 87%, #2d3f27 87.5%) 0 0/44px 76px, linear-gradient(30deg, #2d3f27 12%, transparent 12.5%, transparent 87%, #2d3f27 87.5%) 22px 38px/44px 76px, linear-gradient(150deg, #2d3f27 12%, transparent 12.5%, transparent 87%, #2d3f27 87.5%) 22px 38px/44px 76px" },
];
