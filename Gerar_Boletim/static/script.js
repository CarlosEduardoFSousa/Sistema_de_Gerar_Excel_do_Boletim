let contador = 0;

window.onload = function() {
    const dadosSalvos = JSON.parse(localStorage.getItem('materiasSalvas'));
    if (dadosSalvos) {
        dadosSalvos.forEach(materia => adicionarMateria(materia));
    }
};

function adicionarMateria(dados = null) {
    const container = document.getElementById('container-materias');
    const div = document.createElement('div');
    div.className = 'bloco-materia';

    const nome = dados ? dados.nome : '';
    const n1 = dados ? dados.n1 : '';
    const n2 = dados ? dados.n2 : '';
    const n3 = dados ? dados.n3 : '';
    const n4 = dados ? dados.n4 : '';
    const idx = contador;

    div.innerHTML = `
        <div class="materia-header">
            <h3>Matéria ${idx + 1}</h3>
            <button type="button" class="btn-remover" onclick="removerMateria(this)" title="Remover">✕</button>
        </div>
        <input type="text" name="nome_materia" value="${nome}" placeholder="Nome da matéria" oninput="salvarNoNavegador()" required>
        <div class="notas">
            <input type="number" name="nota1_${idx}" value="${n1}" placeholder="B1" step="0.1" oninput="salvarNoNavegador()">
            <input type="number" name="nota2_${idx}" value="${n2}" placeholder="B2" step="0.1" oninput="salvarNoNavegador()">
            <input type="number" name="nota3_${idx}" value="${n3}" placeholder="B3" step="0.1" oninput="salvarNoNavegador()">
            <input type="number" name="nota4_${idx}" value="${n4}" placeholder="B4" step="0.1" oninput="salvarNoNavegador()">
        </div>
        <hr>
    `;

    container.appendChild(div);
    contador++;
    salvarNoNavegador();
}

function removerMateria(btn) {
    btn.closest('.bloco-materia').remove();
    renumerarMaterias();
    salvarNoNavegador();
}

function renumerarMaterias() {
    const blocos = document.querySelectorAll('.bloco-materia');
    blocos.forEach((bloco, i) => {
        bloco.querySelector('h3').textContent = `Matéria ${i + 1}`;
        ['nota1', 'nota2', 'nota3', 'nota4'].forEach((n, ni) => {
            const inp = bloco.querySelectorAll('.notas input')[ni];
            if (inp) inp.name = `${n}_${i}`;
        });
    });
}

function salvarNoNavegador() {
    const materias = [];
    const blocos = document.querySelectorAll('.bloco-materia');
    blocos.forEach((bloco, index) => {
        const inputs = bloco.querySelectorAll('.notas input');
        materias.push({
            nome: bloco.querySelector('input[name="nome_materia"]').value,
            n1: inputs[0] ? inputs[0].value : '',
            n2: inputs[1] ? inputs[1].value : '',
            n3: inputs[2] ? inputs[2].value : '',
            n4: inputs[3] ? inputs[3].value : ''
        });
    });
    localStorage.setItem('materiasSalvas', JSON.stringify(materias));
}

// ─── IMPORTAR EXCEL ───────────────────────────────────────────────────────────

function importarExcel(input) {
    const arquivo = input.files[0];
    if (!arquivo) return;

    const status = document.getElementById('importar-status');
    status.textContent = '⏳ Importando...';
    status.className = '';

    const formData = new FormData();
    formData.append('arquivo', arquivo);

    fetch('/importar', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            if (data.erro) {
                status.textContent = '❌ ' + data.erro;
                status.className = 'status-erro';
                return;
            }

            // Limpa as matérias atuais
            document.getElementById('container-materias').innerHTML = '';
            contador = 0;

            data.materias.forEach(m => adicionarMateria(m));

            status.textContent = `✅ ${data.total} matéria(s) importada(s)!`;
            status.className = 'status-ok';
        })
        .catch(() => {
            status.textContent = '❌ Erro ao enviar o arquivo.';
            status.className = 'status-erro';
        })
        .finally(() => {
            // Reseta o input para permitir reimportar o mesmo arquivo
            input.value = '';
        });
}

// ─── CALCULADORA DE NOTA ─────────────────────────────────────────────────────

function abrirCalculadora() {
    document.getElementById('modal-overlay').classList.add('ativo');
    voltarTipo();
}

function fecharModal(event) {
    if (event.target === document.getElementById('modal-overlay')) fecharModalBtn();
}

function fecharModalBtn() {
    document.getElementById('modal-overlay').classList.remove('ativo');
}

function voltarTipo() {
    document.getElementById('passo-tipo').classList.remove('hidden');
    document.getElementById('passo-ap').classList.add('hidden');
    document.getElementById('passo-fgb').classList.add('hidden');
    // Limpa campos
    ['ap-nota1','ap-nota2','fgb-p1','fgb-p2','fgb-at'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('resultado-ap').classList.add('hidden');
    document.getElementById('resultado-fgb').classList.add('hidden');
}

function selecionarTipo(tipo) {
    document.getElementById('passo-tipo').classList.add('hidden');
    if (tipo === 'AP') {
        document.getElementById('passo-ap').classList.remove('hidden');
        document.getElementById('ap-nota1').focus();
    } else {
        document.getElementById('passo-fgb').classList.remove('hidden');
        document.getElementById('fgb-p1').focus();
    }
}

function calcularAP() {
    const n1 = parseFloat(document.getElementById('ap-nota1').value);
    const n2 = parseFloat(document.getElementById('ap-nota2').value);
    const res = document.getElementById('resultado-ap');

    if (isNaN(n1) || isNaN(n2)) { res.classList.add('hidden'); return; }

    const media = (n1 + n2) / 2;
    const status = media >= 6 ? '✅ Aprovado' : '❌ Reprovado';
    const cor = media >= 6 ? 'resultado-ok' : 'resultado-fail';

    res.className = `resultado ${cor}`;
    res.innerHTML = `
        <div class="res-linha"><span>Média do Bimestre:</span><strong>${media.toFixed(2)}</strong></div>
        <div class="res-status">${status}</div>
    `;
    res.classList.remove('hidden');
}

function calcularFGB() {
    const p1 = parseFloat(document.getElementById('fgb-p1').value);
    const p2 = parseFloat(document.getElementById('fgb-p2').value);
    const at = parseFloat(document.getElementById('fgb-at').value);
    const res = document.getElementById('resultado-fgb');

    if (isNaN(p1) || isNaN(p2) || isNaN(at)) { res.classList.add('hidden'); return; }

    const mediaProvas = (p1 + p2) / 2;
    const media = mediaProvas * 0.8 + at * 0.2;
    const status = media >= 6 ? '✅ Aprovado' : '❌ Reprovado';
    const cor = media >= 6 ? 'resultado-ok' : 'resultado-fail';

    res.className = `resultado ${cor}`;
    res.innerHTML = `
        <div class="res-linha"><span>Média das Provas:</span><strong>${mediaProvas.toFixed(2)}</strong></div>
        <div class="res-linha"><span>Provas (80%):</span><strong>${(mediaProvas * 0.8).toFixed(2)}</strong></div>
        <div class="res-linha"><span>AT (20%):</span><strong>${(at * 0.2).toFixed(2)}</strong></div>
        <div class="res-linha res-total"><span>Média do Bimestre:</span><strong>${media.toFixed(2)}</strong></div>
        <div class="res-status">${status}</div>
    `;
    res.classList.remove('hidden');
}

document.getElementById('form-boletim').onsubmit = function() {
    // localStorage.removeItem('materiasSalvas');
};
