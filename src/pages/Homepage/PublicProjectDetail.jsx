import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE || 'https://nexus-backend-fbcotg.fly.dev/api').replace(/\/+$/, '');

export default function PublicProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchProject = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await axios.get(`${API_BASE}/projects/${id}`);
        const data = res.data?.project || res.data?.data || res.data;
        if (isMounted) setProject(data);
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Unable to load project.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) fetchProject();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading project...</div>;
  if (error || !project) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">{error || 'Project not found.'}</p>
        <Link to="/" className="text-blue-600 underline">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/" className="text-sm text-blue-600 hover:underline">← Back</Link>
        <Link to="/login" className="text-sm px-4 py-2 rounded bg-blue-600 text-white">
          Sign in to Collaborate
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-3">{project.title}</h1>
      <p className="text-gray-600 whitespace-pre-line">{project.description}</p>
    </div>
  );
}