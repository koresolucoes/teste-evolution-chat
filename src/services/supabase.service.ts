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
    const supabaseUrl = process.env['SUPABASE_URL'];
    const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!supabaseUrl || !supabaseKey) {
      const errorMessage = 'Supabase URL and Key are not configured. Please set SUPABASE_URL and SUPABASE_KEY environment variables.';
      console.error(`FATAL: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // --- Agents ---

  async getAgents(): Promise<Agent[]> {
    const { data, error } = await this.supabase.from('agents').select('*');
    if (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }
    return data as Agent[];
  }

  async addAgent(agentData: Omit<Agent, 'id' | 'created_at'>): Promise<Agent | null> {
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
      throw error;
    }
    return data as Patient[];
  }

  async addPatient(patientData: Omit<Patient, 'id' | 'created_at'>): Promise<Patient | null> {
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

  // FIX: Corrected Omit type from 'createdAt' to 'created_at' to match the WhatsappInstance model.
  async saveWhatsappInstance(instanceData: Omit<WhatsappInstance, 'id' | 'created_at'>): Promise<WhatsappInstance | null> {
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

  async updateWebhookSecret(instanceName: string): Promise<WhatsappInstance | null> {
    const secret = `whsec_${crypto.randomUUID()}`;
    const { data, error } = await this.supabase
      .from('whatsapp_instances')
      .update({ webhook_secret: secret })
      .eq('instance_name', instanceName)
      .select()
      .single();
  
    if (error) {
      console.error('Error updating webhook secret:', error);
      return null;
    }
    return data as WhatsappInstance;
  }
}
