'use client';

import { Home, Task, List, Settings, Logout } from '@mui/icons-material';

const navLinks = [
  { name: 'Início', href: '/home', label: 'Home', icon: <Home />, onlyAuthenticated: true, protected: true },
  { name: 'Tarefas', href: '/tasks', label: 'Tasks', icon: <Task />, onlyAuthenticated: true, protected: true },
  { name: 'Configurações', href: '/settings', label: 'Settings', icon: <Settings />, protected: true },
  { name: 'Sair', href: '/logout', label: 'Logout', icon: <Logout />, onlyAuthenticated: true },
]

export { navLinks as NavLinks };