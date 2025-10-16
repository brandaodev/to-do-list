// Elementos flutuantes animados
function createFloatingElements() {
  const container = document.getElementById('floatingElements');
  for (let i = 0; i < 20; i++) {
    const element = document.createElement('div');
    element.className = 'floating-element';
    element.style.left = Math.random() * 100 + '%';
    element.style.animationDelay = Math.random() * 15 + 's';
    element.style.animationDuration = (15 + Math.random() * 10) + 's';
    container.appendChild(element);
  }
}

// Navegação entre módulos
function showModule(moduleId) {
  // Esconder todos os módulos
  const modules = document.querySelectorAll('.module');
  modules.forEach(module => {
    module.classList.remove('active');
  });

  // Mostrar o módulo selecionado
  document.getElementById(moduleId).classList.add('active');

  // Atualizar botões de navegação
  const buttons = document.querySelectorAll('.nav-btn');
  buttons.forEach(btn => {
    btn.classList.remove('active');
  });
  if (event && event.target) {
    event.target.classList.add('active');
  }

  // Atualizar barra de progresso
  updateProgress(moduleId);

  // Scroll para o topo
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Atualizar barra de progresso
function updateProgress(moduleId) {
  const progressFill = document.querySelector('.progress-fill');
  const progress = {
    'intro': 0,
    'modulo1': 20,
    'modulo2': 40,
    'modulo3': 60,
    'modulo4': 80,
    'modulo5': 100
  };

  if (progressFill) {
    progressFill.style.width = progress[moduleId] + '%';
  }
}

// Função para baixar PDF (simulada)
function downloadPDF() {
  // Preparar para impressão
  window.print();
}

// Animações ao scroll
function addScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  });

  document.querySelectorAll('.section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(50px)';
    section.style.transition = 'all 0.6s ease';
    observer.observe(section);
  });
}

// Efeitos de hover nos cards
function addHoverEffects() {
  document.querySelectorAll('.step').forEach(step => {
    step.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-10px) scale(1.02)';
    });

    step.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });
}

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
  createFloatingElements();
  addScrollAnimations();
  addHoverEffects();
  updateProgress('intro');
});

// Atalhos de teclado
document.addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.key === 'p') {
    e.preventDefault();
    downloadPDF();
  }
});

// Smooth scrolling para links internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Auto-save do progresso (localStorage)
function saveProgress(moduleId) {
  localStorage.setItem('sellerProProgress', moduleId);
}

function loadProgress() {
  const saved = localStorage.getItem('sellerProProgress');
  if (saved) {
    showModule(saved);
  }
}

// Tooltips informativos
function addTooltips() {
  const tooltipElements = document.querySelectorAll('[data-tooltip]');
  tooltipElements.forEach(element => {
    element.addEventListener('mouseenter', function () {
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = this.getAttribute('data-tooltip');
      tooltip.style.cssText = `
                position: absolute;
                background: #333;
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 14px;
                z-index: 1000;
                max-width: 200px;
            `;
      document.body.appendChild(tooltip);

      const rect = this.getBoundingClientRect();
      tooltip.style.left = rect.left + 'px';
      tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
    });

    element.addEventListener('mouseleave', function () {
      const tooltip = document.querySelector('.tooltip');
      if (tooltip) {
        tooltip.remove();
      }
    });
  });
}

// Contador de tempo gasto no treinamento
let startTime = Date.now();
function updateTimeSpent() {
  const timeSpent = Math.floor((Date.now() - startTime) / 60000); // em minutos
  const timeDisplay = document.getElementById('timeSpent');
  if (timeDisplay) {
    timeDisplay.textContent = `Tempo gasto: ${timeSpent} min`;
  }
}

setInterval(updateTimeSpent, 60000); // Atualiza a cada minuto

// Feedback de conclusão
function showCompletionMessage() {
  if (localStorage.getItem('sellerProProgress') === 'modulo5') {
    const message = document.createElement('div');
    message.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #ff6b35, #f7931e);
                color: white;
                padding: 30px;
                border-radius: 15px;
                text-align: center;
                z-index: 1000;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            ">
                <h3>🎉 Parabéns!</h3>
                <p>Você concluiu o Treinamento Seller Pro!</p>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: white;
                    color: #ff6b35;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    margin-top: 15px;
                    cursor: pointer;
                    font-weight: bold;
                ">Fechar</button>
            </div>
        `;
    document.body.appendChild(message);
  }
}

// Verificar conclusão após carregamento
setTimeout(showCompletionMessage, 2000);

// Função para adicionar animação de entrada aos elementos
function animateOnScroll() {
  const elements = document.querySelectorAll('.section, .step, .info-box, .warning-box, .highlight');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(element);
  });
}

// Função para criar efeito de máquina de escrever nos títulos
function typewriterEffect() {
  const titles = document.querySelectorAll('.module-title');

  titles.forEach(title => {
    const text = title.textContent;
    title.textContent = '';
    title.style.borderRight = '2px solid white';

    let i = 0;
    const timer = setInterval(() => {
      title.textContent += text.charAt(i);
      i++;

      if (i === text.length) {
        clearInterval(timer);
        setTimeout(() => {
          title.style.borderRight = 'none';
        }, 500);
      }
    }, 100);
  });
}

// Função para destacar elementos importantes
function highlightImportant() {
  const importantTexts = document.querySelectorAll('strong');

  importantTexts.forEach(text => {
    text.addEventListener('mouseenter', function () {
      this.style.background = 'linear-gradient(120deg, #ff6b35, #f7931e)';
      this.style.color = 'white';
      this.style.padding = '2px 6px';
      this.style.borderRadius = '4px';
      this.style.transition = 'all 0.3s ease';
    });

    text.addEventListener('mouseleave', function () {
      this.style.background = 'none';
      this.style.color = 'inherit';
      this.style.padding = '0';
    });
  });
}

// Adicionar todas as funcionalidades quando a página carregar
document.addEventListener('DOMContentLoaded', function () {
  createFloatingElements();
  addScrollAnimations();
  addHoverEffects();
  animateOnScroll();
  highlightImportant();
  updateProgress('intro');

  // Adicionar efeito de fade-in na capa
  const cover = document.querySelector('.cover');
  if (cover) {
    cover.style.opacity = '0';
    cover.style.transform = 'translateY(50px)';
    cover.style.transition = 'opacity 1s ease, transform 1s ease';

    setTimeout(() => {
      cover.style.opacity = '1';
      cover.style.transform = 'translateY(0)';
    }, 300);
  }
});

// Função para melhorar a experiência de leitura
function enhanceReadingExperience() {
  // Adicionar indicador de progresso de leitura
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 4px;
        background: linear-gradient(90deg, #ff6b35, #f7931e);
        z-index: 1000;
        transition: width 0.3s ease;
    `;
  document.body.appendChild(progressBar);

  // Atualizar progresso baseado no scroll
  window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = (scrollTop / scrollHeight) * 100;
    progressBar.style.width = progress + '%';
  });
}

// Inicializar melhorias na experiência de leitura
document.addEventListener('DOMContentLoaded', enhanceReadingExperience);
