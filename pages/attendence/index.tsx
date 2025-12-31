import React, { useState } from 'react';
import { Calendar, Clock, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface Program {
    id: string;
    title: string;
    date: string;
    time: string;
    description: string;
}

export default function ProgramScheduler() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: '',
        description: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingId) {
            setPrograms(programs.map(prog =>
                prog.id === editingId ? { ...formData, id: editingId } : prog
            ));
            setEditingId(null);
        } else {
            const newProgram: Program = {
                ...formData,
                id: Date.now().toString()
            };
            setPrograms([...programs, newProgram]);
        }

        setFormData({ title: '', date: '', time: '', description: '' });
        setIsAdding(false);
    };

    const handleEdit = (program: Program) => {
        setFormData({
            title: program.title,
            date: program.date,
            time: program.time,
            description: program.description
        });
        setEditingId(program.id);
        setIsAdding(true);
    };

    const handleDelete = (id: string) => {
        setPrograms(programs.filter(prog => prog.id !== id));
    };

    const handleCancel = () => {
        setFormData({ title: '', date: '', time: '', description: '' });
        setIsAdding(false);
        setEditingId(null);
    };

    const sortedPrograms = [...programs].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
    });

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Program Scheduler</h1>
                        {!isAdding && (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        )}
                    </div>

                    {isAdding && (
                        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-xl">
                            <h2 className="text-xl font-semibold mb-4 text-gray-700">
                                {editingId ? 'Edit Program' : 'New Program'}
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Program Title
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Enter program title"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Calendar className="inline mr-2" size={16} />
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Clock className="inline mr-2" size={16} />
                                            Time
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Add program description (optional)"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    <Check size={18} />
                                    {editingId ? 'Update' : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="flex items-center gap-2 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    <X size={18} />
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="space-y-4">
                        {sortedPrograms.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                                <p>No programs scheduled yet. Add your first program!</p>
                            </div>
                        ) : (
                            sortedPrograms.map((program) => (
                                <div
                                    key={program.id}
                                    className="bg-linear-to-r from-indigo-50 to-blue-50 p-5 rounded-xl border border-indigo-200 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                                {program.title}
                                            </h3>
                                            <div className="flex gap-4 text-sm text-gray-600 mb-2">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={16} />
                                                    {new Date(program.date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={16} />
                                                    {program.time}
                                                </span>
                                            </div>
                                            {program.description && (
                                                <p className="text-gray-600 text-sm">{program.description}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(program)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(program.id)}
                                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
