'use client';

import { Box, Typography, Card, TextField, InputAdornment, IconButton, Button } from '@mui/material';
import { Lock, Email, Visibility, VisibilityOff } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { update } from '@/services/auth';
import { getCurrentUser } from '@/services/auth';

export default function SettingsPage() {
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const handleClickShowPassword = () => setShowPassword(!showPassword);
    const handleUpdate = async () => {
        try {
            const data = await update(name, email, password);
            setIsEditing(false);
        } catch (error) {
            console.error("Erro ao criar conta:", error);
            setError("Falha ao criar conta." + error);
        }
    }

    useEffect(() => {
        const fetchUser = async () => {
            const user = await getCurrentUser();
            setName(user ? (user as any).name : '');
            setEmail(user ? (user as any).email : '');
            setPassword('');
        }
        fetchUser();
    }, []);

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Typography variant='h2' fontWeight="bold">Configurações</Typography>
            <Card sx={{ padding: 2, margin: 2 }}>
                <TextField
                    id="name"
                    label="Nome"
                    type="text"
                    fullWidth
                    margin="normal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    contentEditable={isEditing}
                />
                <TextField
                    id="email"
                    label="E-mail"
                    type="email"
                    fullWidth
                    margin="normal"
                    slotProps={{ input: { startAdornment: (<Email />) } }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    contentEditable={isEditing}
                />
                <TextField
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    margin="normal"
                    slotProps={{
                        input: {
                            startAdornment: (<Lock />),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }
                    }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    contentEditable={isEditing}
                />
                {error && <Typography color="error" variant="body2">{error}</Typography>}
                <Card sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, padding: 1 }}>
                    {isEditing ? (
                        <>
                            <Button variant="outlined" color="error" onClick={() => setIsEditing(false)}>Cancelar</Button>
                            <Button variant="contained" color="primary" onClick={handleUpdate}>Salvar</Button>
                        </>

                    ) : (
                        <Button variant="outlined" color="primary" onClick={() => setIsEditing(true)}>Editar</Button>
                    )}
                </Card>

            </Card>
        </Box>
    );
}
