// app/tasks/page.tsx
'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TaskList from '@/app/ui/home/task/task-list';
import {api} from '@/services/api';

interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
  creator: { name: string; email: string };
  assignee: { id: number; name: string; email: string } | null;
}

export default function TasksPage() {
  const [openModal, setOpenModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'pending' as 'pending' | 'in_progress' | 'completed',
    due_date: '',
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        due_date: task.due_date || '',
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        due_date: '',
      });
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingTask(null);
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      const method = editingTask ? 'PUT' : 'POST';
      const url = editingTask ? `/tasks/${editingTask.id}` : '/tasks';

      const body = {
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        status: formData.status,
        due_date: formData.due_date || null,
      };
      const res = await api.request({
        url,
        method,
        data: body,
      });

      if (res.status < 200 || res.status >= 300) {
        const err = await res.data;
        throw new Error(err.message || 'Erro ao salvar');
      }

      handleCloseModal();
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
        if (err.response && err.response.status === 422) {
        const validationErrors = err.response.data.errors;
      
        const firstError = Object.values(validationErrors)[0][0];
        setError(firstError);
    } else {
      setError(err.response?.data?.message || err.message || 'Erro ao salvar tarefa');
    }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta tarefa?')) return;

    try {
      const res = await api.delete(`/tasks/${id}`);
      if (res.status < 200 || res.status >= 300) throw new Error('Erro ao deletar');
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      setError('Erro ao deletar tarefa');
    }
  };

  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto', px: 3, py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Minhas Tarefas
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Nova Tarefa
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TaskList onEdit={handleOpenModal} onDelete={handleDelete} onRefresh={() => setRefreshKey(prev => prev + 1)} key={refreshKey} />

      {/* Modal de Criação/Edição */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTask ? 'Editar' : 'Nova'} Tarefa</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label="Título" required fullWidth value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            <TextField label="Descrição" multiline rows={3} fullWidth value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <TextField select label="Prioridade" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}>
              <MenuItem value="low">Baixa</MenuItem>
              <MenuItem value="medium">Média</MenuItem>
              <MenuItem value="high">Alta</MenuItem>
            </TextField>
            <TextField select label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
              <MenuItem value="pending">Pendente</MenuItem>
              <MenuItem value="in_progress">Em Progresso</MenuItem>
              <MenuItem value="completed">Concluída</MenuItem>
            </TextField>
            <TextField label="Data de Vencimento" type="date" InputLabelProps={{ shrink: true }} value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingTask ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Fab color="primary" aria-label="add" sx={{ position: 'fixed', bottom: 16, right: 16 }} onClick={() => handleOpenModal()}>
        <AddIcon />
      </Fab>
    </Box>
  );
}