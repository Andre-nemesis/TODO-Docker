// components/TaskList.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
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

interface TaskListProps {
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void; // para recarregar após ações
}

export default function TaskList({ onEdit, onDelete, onRefresh }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);


  useEffect(() => {
    fetchTasks();
  }, [onRefresh]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/tasks');

      if (response.status !== 200) {
        if (response.status === 401) {
          setError('Sessão expirada. Faça login novamente.');
          return;
        }
        throw new Error('Erro ao carregar tarefas');
      }

      const result = await response.data;
      setTasks(Array.isArray(result) ? result : result.data || []);
    } catch (err) {
      setError('Não foi possível carregar as tarefas.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string): 'error' | 'warning' | 'success' | 'default' => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string): 'success' | 'info' | 'default' => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'in_progress': return 'Em Progresso';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, task: Task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleEdit = () => {
    if (selectedTask) onEdit(selectedTask);
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedTask) onDelete(selectedTask.id);
    handleMenuClose();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (tasks.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h6" color="textSecondary">
          Nenhuma tarefa encontrada
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <List sx={{ width: '100%' }}>
        {tasks.map((task) => (
          <ListItem
            key={task.id}
            sx={{
              mb: 1,
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              '&:hover': { backgroundColor: '#f5f5f5' },
            }}
            secondaryAction={
              <IconButton edge="end" aria-label="options" onClick={(e) => handleMenuOpen(e, task)}>
                <MoreVertIcon />
              </IconButton>
            }
          >
            <ListItemAvatar>
              <Avatar src={`https://i.pravatar.cc/40?u=${task.assignee?.email || task.creator.email}`} />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  {task.status === 'completed' ? (
                    <CheckCircleIcon color="success" fontSize="small" />
                  ) : (
                    <PendingActionsIcon fontSize="small" />
                  )}
                  <Typography
                    variant="subtitle1"
                    sx={{
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                  </Typography>
                </Box>
              }
              secondary={
                <Box component="div" mt={1}>
                  <Typography variant="body2" color="textSecondary">
                    {task.description || 'Sem descrição'}
                  </Typography>
                  <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                    <Chip label={getPriorityLabel(task.priority)} size="small" color={getPriorityColor(task.priority)} variant="outlined" />
                    <Chip label={getStatusLabel(task.status)} size="small" color={getStatusColor(task.status)} variant="outlined" />
                    {task.due_date && (
                      <Chip label={formatDueDate(task.due_date)!} size="small" variant="outlined" />
                    )}
                    {task.assignee && (
                      <Chip label={`Para: ${task.assignee.name}`} size="small" variant="outlined" />
                    )}
                  </Box>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>Editar</MenuItem>
        <MenuItem onClick={handleDelete}>Deletar</MenuItem>
      </Menu>
    </>
  );
}