import json
from datetime import datetime

def transform_teacher(teacher):
    # Get the first qualification (since schema expects single values)
    qual = teacher['qualification'][0] if teacher['qualification'] else {}
    
    # Transform the data to match schema
    transformed = {
        "_id": teacher["_id"],
        "first_name": teacher["first_name"],
        "last_name": teacher["last_name"],
        "gender": teacher["gender"].lower(),  # schema expects lowercase
        "fathers_name": teacher["father_name"],  # note the field name difference
        "address": teacher["address"],
        "cnic": teacher["cnic"],
        "phone": teacher["phone"],
        "dob": teacher["dob"],
        # Transform qualification fields
        "qualification": qual.get("degree", ""),
        "yearOfGraduation": qual.get("year", ""),
        "marksObtained": qual.get("marks", ""),
        "boardOrUniversity": qual.get("institution", ""),
        # Transform appointment fields
        "designation": teacher["appointment"]["designation"],
        "joining_date": teacher["appointment"]["date"],
        "appointed_by": teacher["appointment"]["appointed_by"],
        "package": str(teacher["appointment"]["salary"])  # convert to string as per schema
    }
    return transformed

def main():
    # Read the original data
    with open('addons/teachers.json', 'r') as f:
        teachers = json.load(f)
    
    # Transform each teacher
    transformed_teachers = [transform_teacher(teacher) for teacher in teachers]
    
    # Write the transformed data
    with open('addons/transformed_teachers.json', 'w') as f:
        json.dump(transformed_teachers, f, indent=2)
    
    print(f"Transformed {len(transformed_teachers)} teacher records")
    print("Saved to addons/transformed_teachers.json")

if __name__ == "__main__":
    main() 