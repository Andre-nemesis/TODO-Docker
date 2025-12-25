"use client";

import React, { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Chip,
    Container,
    Box,
    CircularProgress,
    Divider,
    List,
    ListItem,
    ListItemText,
    Alert,
    Stack,
} from '@mui/material';
import { getCurrentUser } from '@/services/auth';
import { api } from '@/services/api';

// Tipo correto conforme resposta da API Laravel
interface Task {
    id: number;
    title: string;
    description: string | null;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed';
    due_date: string | null; // formato ISO com timezone
    created_at: string;
    creator: {
        id: number;
        name: string;
        email: string;
    };
    assignee: {
        id: number;
        name: string;
        email: string;
    } | null;
}

interface DashboardStats {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    highPriorityTasks: number;
}

export default function HomePage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        highPriorityTasks: 0,
    });
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState<string>('');

    useEffect(() => {
        // Carrega nome do usuário
        getCurrentUser().then(user => {
            if (user) {
                setUserName((user as any).name || '');
            }
        });

        // Carrega tarefas
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await api.get('/tasks');
            // A API retorna { data: [...] }
            const taskList: Task[] = response.data.data || [];

            setTasks(taskList);
            calculateStats(taskList);
        } catch (error) {
            console.error('Erro ao carregar tarefas:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (taskList: Task[]) => {
        const completed = taskList.filter(t => t.status === 'completed').length;
        const highPriority = taskList.filter(t => t.priority === 'high').length;

        setStats({
            totalTasks: taskList.length,
            completedTasks: completed,
            pendingTasks: taskList.length - completed,
            highPriorityTasks: highPriority,
        });
    };

    // Formatação simples da data (ex: 30 Dez 2025)
    const formatDueDate = (dateString: string | null) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const getPriorityLabel = (priority: string) => {
        return { high: 'Alta', medium: 'Média', low: 'Baixa' }[priority] || priority;
    };

    const getPriorityColor = (priority: string): 'error' | 'warning' | 'success' => {
        return { high: 'error', medium: 'warning', low: 'success' }[priority] as any || 'default';
    };

    const getStatusLabel = (status: string) => {
        return { completed: 'Concluída', in_progress: 'Em Progresso', pending: 'Pendente' }[status] || status;
    };

    const getStatusColor = (status: string): 'success' | 'info' | 'warning' => {
        return { completed: 'success', in_progress: 'info', pending: 'warning' }[status] as any || 'warning';
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
                Bem-vindo{userName ? `, ${userName}` : ''}
            </Typography>

            {/* Stats Grid */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 4 }}>
                <StatCard label="Total de Tarefas" value={stats.totalTasks} color="info" />
                <StatCard label="Concluídas" value={stats.completedTasks} color="success" />
                <StatCard label="Pendentes" value={stats.pendingTasks} color="warning" />
                <StatCard label="Alta Prioridade" value={stats.highPriorityTasks} color="error" />
            </Stack>

            {/* Lista de Tarefas */}
            <Card>
                <CardContent>
                    <Typography variant="h5" component="h2" sx={{ fontWeight: '600', mb: 2 }}>
                        Tarefas Recentes
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {tasks.length === 0 ? (
                        <Alert severity="info">Nenhuma tarefa encontrada</Alert>
                    ) : (
                        <List>
                            {tasks.map((task, index) => (
                                <Box key={task.id}>
                                    <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <ListItemText
                                                primary={
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{
                                                            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                                                            color: task.status === 'completed' ? 'text.disabled' : 'inherit',
                                                            fontWeight: 'medium',
                                                        }}
                                                    >
                                                        {task.title}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <>
                                                        {task.description && (
                                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                                {task.description}
                                                            </Typography>
                                                        )}
                                                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                                            <Chip
                                                                label={getPriorityLabel(task.priority)}
                                                                size="small"
                                                                color={getPriorityColor(task.priority)}
                                                                variant="outlined"
                                                            />
                                                            <Chip
                                                                label={getStatusLabel(task.status)}
                                                                size="small"
                                                                color={getStatusColor(task.status)}
                                                                variant="outlined"
                                                            />
                                                            {task.due_date && formatDueDate(task.due_date) && (
                                                                <Chip
                                                                    label={formatDueDate(task.due_date)!}
                                                                    size="small"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                            {task.assignee && (
                                                                <Chip
                                                                    label={`Para: ${task.assignee.name}`}
                                                                    size="small"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                        </Box>
                                                    </>
                                                }
                                            />
                                        </Box>
                                    </ListItem>
                                    {index < tasks.length - 1 && <Divider />}
                                </Box>
                            ))}
                        </List>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'info' | 'success' | 'warning' | 'error' }) {
    return (
        <Card sx={{ bgcolor: `${color}.main`, color: 'white', flex: 1, minWidth: 200 }}>
            <CardContent>
                <Typography gutterBottom sx={{ opacity: 0.9 }}>
                    {label}
                </Typography>
                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                    {value}
                </Typography>
            </CardContent>
        </Card>
    );
}