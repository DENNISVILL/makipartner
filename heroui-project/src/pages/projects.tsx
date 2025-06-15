import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner, Chip, Tabs, Tab, Progress } from '@heroui/react';
import { Icon } from '@iconify/react';
import odooService from '../services/odooService';

interface Project {
  id: number;
  name: string;
  user_id: [number, string] | false;
  partner_id: [number, string] | false;
  task_count: number;
  date_start: string;
}

interface Task {
  id: number;
  name: string;
  project_id: [number, string];
  user_ids: [number, string][];
  stage_id: [number, string];
  date_deadline: string;
}

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'projects') {
        const projectData = await odooService.getProjects();
        setProjects(projectData);
      } else {
        const taskData = await odooService.getTasks();
        setTasks(taskData);
      }
    } catch (error) {
      console.error('Error loading project data:', error);
      setError('Error al cargar los datos de proyectos. Verifica la conexión con Odoo.');
    } finally {
      setLoading(false);
    }
  };

  const getTaskStageColor = (stage: string) => {
    if (stage.toLowerCase().includes('nuevo') || stage.toLowerCase().includes('draft')) return 'default';
    if (stage.toLowerCase().includes('progreso') || stage.toLowerCase().includes('doing')) return 'primary';
    if (stage.toLowerCase().includes('completado') || stage.toLowerCase().includes('done')) return 'success';
    if (stage.toLowerCase().includes('cancelado') || stage.toLowerCase().includes('cancel')) return 'danger';
    return 'secondary';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Proyectos</h1>
        <Button 
          color="primary" 
          startContent={<Icon icon="lucide:refresh-cw" />}
          onPress={loadData}
          isLoading={loading}
        >
          Actualizar
        </Button>
      </div>

      {error && (
        <Card className="mb-6 bg-danger-50 border-danger-200">
          <CardBody className="flex flex-row items-center gap-3">
            <Icon icon="lucide:alert-circle" className="text-danger" />
            <p className="text-danger">{error}</p>
          </CardBody>
        </Card>
      )}

      <Tabs 
        selectedKey={activeTab} 
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="mb-6"
      >
        <Tab key="projects" title="Proyectos">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Proyectos</h2>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : (
                <Table aria-label="Tabla de proyectos">
                  <TableHeader>
                    <TableColumn>PROYECTO</TableColumn>
                    <TableColumn>RESPONSABLE</TableColumn>
                    <TableColumn>CLIENTE</TableColumn>
                    <TableColumn>TAREAS</TableColumn>
                    <TableColumn>FECHA INICIO</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No hay proyectos">
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>{project.name}</TableCell>
                        <TableCell>{project.user_id ? project.user_id[1] : 'Sin asignar'}</TableCell>
                        <TableCell>{project.partner_id ? project.partner_id[1] : 'Interno'}</TableCell>
                        <TableCell>
                          <Chip color="primary" size="sm">
                            {project.task_count} tareas
                          </Chip>
                        </TableCell>
                        <TableCell>{new Date(project.date_start).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Tab>
        
        <Tab key="tasks" title="Tareas">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Tareas</h2>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : (
                <Table aria-label="Tabla de tareas">
                  <TableHeader>
                    <TableColumn>TAREA</TableColumn>
                    <TableColumn>PROYECTO</TableColumn>
                    <TableColumn>ASIGNADO A</TableColumn>
                    <TableColumn>ETAPA</TableColumn>
                    <TableColumn>FECHA LÍMITE</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No hay tareas">
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>{task.name}</TableCell>
                        <TableCell>{task.project_id[1]}</TableCell>
                        <TableCell>
                          {task.user_ids.length > 0 ? task.user_ids[0][1] : 'Sin asignar'}
                        </TableCell>
                        <TableCell>
                          <Chip color={getTaskStageColor(task.stage_id[1])} size="sm">
                            {task.stage_id[1]}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          {task.date_deadline ? new Date(task.date_deadline).toLocaleDateString() : 'Sin fecha'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};