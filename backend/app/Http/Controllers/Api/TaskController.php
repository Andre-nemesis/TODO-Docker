<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    /**
     * Listar todas as tarefas do usuário autenticado
     * Inclui tarefas criadas por ele e tarefas atribuídas a ele
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $tasks = Task::where('user_id', $user->id)
            ->orWhere('assigned_to', $user->id)
            ->with(['creator', 'assignee'])
            ->orderBy('due_date', 'asc')
            ->orderBy('priority', 'desc')
            ->get();

        return response()->json([
            'data' => $tasks
        ]);
    }

    /**
     * Criar nova tarefa
     */
    public function store(Request $request)
    {   
        $messages = [
            'due_date.date' => 'O formato da data enviado não é válido.',
            'due_date.after_or_equal' => 'A data de entrega não pode ser no passado. Escolha hoje ou um dia futuro.',
            'title.required' => 'O título da tarefa é obrigatório.',
        ];


        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:low,medium,high',
            'due_date' => 'nullable|date|after_or_equal:today',
            'assigned_to' => 'nullable|exists:users,id', // Pode atribuir na criação
        ], $messages);

        if(!$validated) {
            return response()->json([
                'message' => 'Nenhum dado válido fornecido para criar a tarefa'
            ], 400);
        }

        $task = Task::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'priority' => $validated['priority'],
            'due_date' => $validated['due_date'] ?? null,
            'status' => 'pending', // padrão
            'user_id' => $request->user()->id,
            'assigned_to' => $validated['assigned_to'] ?? null,
        ]);

        $task->load(['creator', 'assignee']);

        return response()->json([
            'message' => 'Tarefa criada com sucesso',
            'data' => $task
        ], 201);
    }

    /**
     * Exibir uma tarefa específica
     */
    public function show(Task $task)
    {
        // Verifica se o usuário tem permissão (criador ou atribuído)
        $this->authorizeTaskAccess($task);

        $task->load(['creator', 'assignee']);

        return response()->json([
            'data' => $task
        ], 200);
    }

    /**
     * Atualizar tarefa
     */
    public function update(Request $request, Task $task)
    {
        $this->authorizeTaskAccess($task);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'sometimes|required|in:low,medium,high',
            'due_date' => 'nullable|date|after_or_equal:today',
            'status' => 'sometimes|required|in:pending,in_progress,completed',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        if(!$validated) {
            return response()->json([
                'message' => 'Nenhum dado válido fornecido para atualização'
            ], 400);
        }

        $task->update($validated);

        $task->load(['creator', 'assignee']);

        return response()->json([
            'message' => 'Tarefa atualizada com sucesso',
            'data' => $task
        ], 200);
    }

    /**
     * Deletar tarefa
     */
    public function destroy(Task $task)
    {
        $this->authorizeTaskAccess($task);

        // Apenas o criador pode deletar
        if ($task->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Você só pode deletar tarefas que criou'
            ], 403);
        }

        $task->delete();

        return response()->json([
            'message' => 'Tarefa deletada com sucesso'
        ], 204);
    }

    /**
     * Atribuir tarefa a um usuário
     */
    public function assign(Request $request, Task $task)
    {
        $this->authorizeTaskAccess($task);

        // Apenas o criador pode atribuir
        if ($task->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Apenas o criador da tarefa pode atribuí-la'
            ], 403);
        }

        $validated = $request->validate([
            'assigned_to' => 'required|exists:users,id'
        ]);

        $task->update(['assigned_to' => $validated['assigned_to']]);

        $task->load(['creator', 'assignee']);

        return response()->json([
            'message' => 'Tarefa atribuída com sucesso',
            'data' => $task
        ], 200);
    }

    /**
     * Método auxiliar para verificar acesso à tarefa
     */
    private function authorizeTaskAccess(Task $task)
    {
        $userId = Auth::id();

        if ($task->user_id !== $userId && $task->assigned_to !== $userId) {
            abort(403, 'Acesso não autorizado a esta tarefa');
        }
    }
}
