import mongoose,{Model,Document,model,Schema,Types} from "mongoose";

export interface Class extends Document {
    className:  typeof classNames[number]
    sections:  typeof sections[number]
    fee: number
}

const sections =['A','B','C','D','E'] as const
const classNames = ['Prep','Nursery','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th'] as const

const classSchema = new Schema<Class>({
    className: {
        type: String,
        enum: classNames,
        required: true
    },
    sections: {
        type: String,
        enum: sections,
        required: true
    },
    fee: {
        type: Number,
        required: true
    }
},{
    timestamps: true
})

export const ClassModel = model<Class>('Class',classSchema)


export const findClasses = async ()=>{
    return await ClassModel.find({})
}

export const insertMany = async (data: Partial<Class[]>) => {
    const classModel = new ClassModel(data)
    await classModel.save()
    return classModel
}

export const findClassById = async (id: string)=>{
    return await ClassModel.findById(id)
}

export const deleteClass = async (id: string)=>{
    return await ClassModel.findByIdAndDelete(id)
     
}

export const updateClass = async ( id: string, data: Partial<Class>)=>{
    return await ClassModel.findByIdAndUpdate(id,data)
}

