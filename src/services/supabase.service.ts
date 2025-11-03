import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Agent } from '../models/agent.model';
import { Patient } from '../models/patient.model';
import { WhatsappInstance } from '../models/whatsapp-instance.model';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = 'https://ahhseskrpybaqlqqcdve.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoaHNlc2tycHliYXFscXFjZHZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNDU2NTAsImV4cCI6MjA2NTcyMTY1MH0.YGd2HcO16zCHixxhxBq8gf3bIY-HbOC77l9vEiMAjSA';

    // The original code checked for environment variables which are not available
    // in this applet environment. Hardcoding the provided credentials fixes the connection.
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // --- Agents ---

  async getAgents(): Promise<Agent[]> {
    const { data, error } = await this.supabase.from('agents').select('*');
    if (error) {
      console.error('Error fetching agents:', error);
      return [];
    }
    return data as Agent[];
  }

  async addAgent(agentData: Omit<Agent, 'id' | 'createdAt'>): Promise<Agent | null> {
    const { data, error } = await this.supabase
      .from('agents')
      .insert([agentData])
      .select()
      .single();
    if (error) {
      console.error('Error adding agent:', error);
      return null;
    }
    return data as Agent;
  }

  async updateAgent(agent: Agent): Promise<Agent | null> {
    const { id, ...updateData } = agent;
    const { data, error } = await this.supabase
      .from('agents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Error updating agent:', error);
      return null;
    }
    return data as Agent;
  }

  // --- Patients ---

  async getPatients(): Promise<Patient[]> {
    const { data, error } = await this.supabase.from('patients').select('*');
    if (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
    return data as Patient[];
  }

  async addPatient(patientData: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient | null> {
    const { data, error } = await this.supabase
      .from('patients')
      .insert([patientData])
      .select()
      .single();
    if (error) {
      console.error('Error adding patient:', error);
      return null;
    }
    return data as Patient;
  }
  
  // --- WhatsApp Instance ---

  async getWhatsappInstance(): Promise<WhatsappInstance | null> {
    const { data, error } = await this.supabase
      .from('whatsapp_instances')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: no rows found, which is fine
      console.error('Error fetching whatsapp instance:', error);
    }
    return data || null;
  }

  async saveWhatsappInstance(instanceData: Omit<WhatsappInstance, 'id' | 'createdAt'>): Promise<WhatsappInstance | null> {
    // Assuming 'instance_name' is the unique constraint for upserting.
    const { data, error } = await this.supabase
      .from('whatsapp_instances')
      .upsert(instanceData, { onConflict: 'instance_name' })
      .select()
      .single();
      
    if (error) {
      console.error('Error saving whatsapp instance:', error);
      return null;
    }
    return data as WhatsappInstance;
  }
}
