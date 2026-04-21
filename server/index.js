const express = require('express');
const path = require('path');
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rotas da API
const motoristasRouter = require('./routes/motoristas');
const gestoresRouter = require('./routes/gestores');
const encarregadosRouter = require('./routes/encarregados');
const placasRouter = require('./routes/placas');
const statusRouter = require('./routes/status');
const ordensRouter = require('./routes/ordens');
const servicosRouter = require('./routes/servicos');

app.use('/api/motoristas', motoristasRouter);
app.use('/api/gestores', gestoresRouter);
app.use('/api/encarregados', encarregadosRouter);
app.use('/api/placas', placasRouter);
app.use('/api/status', statusRouter);
app.use('/api/ordens', ordensRouter);
app.use('/api/servicos', servicosRouter);

// Rota de teste
app.get('/api/test', (req, res) => res.json({ success: true }));

// SPA fallback - DEVE VIR DEPOIS DAS ROTAS DA API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Necessário para o Render
app.listen(PORT, HOST, () => console.log(`Frota Manager rodando na porta ${PORT}`));
