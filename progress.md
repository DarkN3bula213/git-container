# Progress logs

### Classes

1. Define all crud operations [+]
2. Write schemas for all write operations /: 
3. Write seeding functions
4. Write tests for all


# Students


import { createClient, RedisClientType } from 'redis';
import { Logger } from './Logger'; // Adjust the import path as necessary

class RedisCache {
  private static instance: RedisCache;
  private client: RedisClientType;
  private connectAttempts = 0;

  private constructor(private url: string) {
    this.client = createClient({ url: this.url });
    this.setupEventListeners();
  }

  public static getInstance(url: string): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache(url);
    }
    return RedisCache.instance;
  }

  private setupEventListeners(): void {
    // Event listeners as you defined them
  }

  public async connect(): Promise<void> {
    // Your connect method as defined
  }

  private async handleReconnect(): Promise<void> {
    // Your handleReconnect method as defined
  }

  private calculateExponentialBackoff(attempts: number): number {
    // Your calculateExponentialBackoff method as defined
  }

  public async disconnect(): Promise<void> {
    // Your disconnect method as defined
  }

  public getClient(): RedisClientType {
    return this.client;
  }
}


version: '3.7'

services:

  postgres:
    image: postgres:alpine
    environment:
      POSTGRES_PASSWORD: devpassword # Use secure passwords in production
    ports:
      - "5432:5432"

  redis:
    image: redis:alpine
    command: redis-server #--requirepass devpassword # Use secure passwords in production
    ports:
      - "6379:6379"

  mongo:
    image: mongo:latest
    command: mongod --auth
    environment:
      MONGO_INITDB_ROOT_USERNAME: devuser
      MONGO_INITDB_ROOT_PASSWORD: devpassword # Use secure passwords in production
    ports:
      - "27017:27017"


      ```ts
      // Import types from react-hook-form if you're using its validation schema
import { Allocation, GuardianInfo, PersonalInformation } from '@/types/forms';
import { RegisterOptions } from 'react-hook-form';
 
interface BaseFormFieldConfig<T> {
  name: keyof T;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'radio' | 'checkbox' ;
  validation: RegisterOptions;
  autoComplete?: string;
}
interface SelectFormFieldConfig<T> extends BaseFormFieldConfig<T> {
  type: 'select';
  options: { label: string; value: string | number }[];
}

export type FormFieldConfig<T> = BaseFormFieldConfig<T> | SelectFormFieldConfig<T>;
interface LoginInput {
  email: string;
  password: string;
}
export const loginFields: FormFieldConfig<LoginInput>[] = [
  {
    name: 'email',
    label: 'Email',
    type: 'text',
    validation: { required: 'Email is required' },
    autoComplete: 'off',
  },
  {
    name: 'password',
    label: 'Password',
    type: 'text',
    validation: { required: 'Password is required' },
    autoComplete: 'off',
  },

]

export const requiredFields=()= FormFieldConfig<RequireInfo>[] =>{return[
  {
    section:'Personal Information',
    fields:[
      name,
    
      place_of_birth,
      dob,
      gender,
      address

    ]
  },
  {
    section:'Guardian Information',
    fields:[
        father_name,
      father_cnic,
      father_occupation,
      phone


    ]
  },{
    section:'Contact Information',
    fields:[address,phone]
  }
]}

export const personalFields: FormFieldConfig<PersonalInformation>[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    validation: { required: 'Name is required' },
    autoComplete: 'off',
  },
  {
    name: 'father_name',
    label: "Father's Name",
    type: 'text',
    validation: { required: "Father's Name is required" },
    autoComplete: 'off',
  },

  {
    name: 'place_of_birth',
    label: 'Place of Birth',
    type: 'text',
    validation: { required: 'Place of Birth is required' },
    autoComplete: 'off',
  },
  {
    name: 'dob',
    label: 'Date of Birth',
    type: 'date',
    validation: { required: 'Date of Birth is required' },
    autoComplete: 'off',
  },
  {
    name: 'form_b',
    label: 'Form B No',
    type: 'text',
    validation: { required: 'Form B is required' },
    autoComplete: 'off',
  },
];

export const guardianFields: FormFieldConfig<GuardianInfo>[] = [
  {
    name: 'father_cnic',
    label: "Guardian's CNIC",
    type: 'text',
    validation: {
      required: "Guardian's CNIC is required",
      minLength: 13,
      maxLength: 13,
    },
    autoComplete: 'off',
  },
  {
    name: 'father_occupation',
    label: "Guardian's Occupation",
    type: 'text',
    validation: { required: "Guardian's Occupation is required" },
    autoComplete: 'off',
  },
  {
    name: 'cast',
    label: "Guardian's Cast",
    type: 'text',
    validation: { required: 'Cast is required' },
    autoComplete: 'off',
  },
  {
    name: 'religion',
    label: 'Religion',
    type: 'text',
    validation: { required: "Guardian's Email is required" },
    autoComplete: 'off',
  },
  {
    name: 'address',
    label: 'Address',
    type: 'text',
    validation: { required: 'Address is required' },
    autoComplete: 'off',
  },
  {
    name: 'phone',
    label: 'Phone',
    type: 'text',
    validation: { required: 'Phone is required' },
    autoComplete: 'off',
  },
];

export const allocationFields: FormFieldConfig<Allocation>[] = [];
```