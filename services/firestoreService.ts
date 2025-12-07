
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { Project, ProjectStatus } from '../types';

// Collection References
const PROJECTS_COL = 'projects';

// --- PROJECTS ---

export const getProjects = async (): Promise<Project[]> => {
  if (!db) throw new Error("Firestore not initialized");
  const querySnapshot = await getDocs(collection(db, PROJECTS_COL));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
};

export const addProject = async (project: Omit<Project, 'id'>): Promise<Project> => {
  if (!db) throw new Error("Firestore not initialized");
  // Firestore creates a unique ID automatically
  const docRef = await addDoc(collection(db, PROJECTS_COL), project);
  return { id: docRef.id, ...project };
};

export const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, PROJECTS_COL, id);
  await updateDoc(docRef, updates);
};

export const deleteProject = async (id: string): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  await deleteDoc(doc(db, PROJECTS_COL, id));
};

// --- GENERIC HELPERS FOR OTHER COLLECTIONS (Future Use) ---
// You can replicate the pattern above for 'tenders', 'inventory', etc.
