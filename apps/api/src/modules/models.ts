import mongoose, {Connection,Model,Schema} from 'mongoose';

const profileSchema=new Schema({
  fullName:{type:String,required:true,trim:true,maxlength:120},email:{type:String,trim:true,lowercase:true},rollNumber:String,registerNumber:String,
  department:String,section:String,semester:Number,cgpa:Number,dateOfBirth:Date,gender:String,phoneNumber:String,linkedin:String,github:String,
  portfolio:String,leetcode:String,hackerrank:String,codechef:String,codeforces:String,address:String,careerObjective:String,photoUrl:String,databaseName:String
},{timestamps:true,strict:'throw'});
profileSchema.index({email:1});
// The connected/default database keeps only the student account registry and legacy records.
export const Student=mongoose.models.Student||mongoose.model('Student',profileSchema,'students');

const studentApplicationSchema=new Schema({
  studentId:{type:Schema.Types.ObjectId,ref:'StudentProfile',required:true,unique:true},status:{type:String,enum:['draft','saved','pending_review'],default:'draft'},
  personal:{type:Schema.Types.Mixed,default:{}},family:{type:Schema.Types.Mixed,default:{}},academic:{type:Schema.Types.Mixed,default:{semesterRecords:[]}},
  arrears:{type:Schema.Types.Mixed,default:{records:[]}},technical:{type:Schema.Types.Mixed,default:{}},selfEvaluation:{type:Schema.Types.Mixed,default:{}},
  careerGoal:{type:Schema.Types.Mixed,default:{}},consent:{type:Boolean,default:false},submittedAt:Date
},{timestamps:true,strict:true});
export const StudentApplication=mongoose.models.StudentApplication||mongoose.model('StudentApplication',studentApplicationSchema,'studentapplications');

const definitions:Record<string,Record<string,unknown>>={
  education:{level:{type:String,required:true},institution:{type:String,required:true},board:String,field:String,startYear:Number,endYear:Number,score:Number,backlogs:Number,semesterMarks:[{semester:Number,score:Number,backlogs:Number}]},
  skills:{name:{type:String,required:true},category:String,level:String,yearsExperience:Number},
  projects:{name:{type:String,required:true},description:String,technologies:[String],githubUrl:String,liveUrl:String,startDate:Date,endDate:Date,teamSize:Number,imageUrls:[String],status:String},
  experience:{company:{type:String,required:true},role:String,description:String,startDate:Date,endDate:Date,currentlyWorking:Boolean},
  internships:{company:{type:String,required:true},role:String,description:String,startDate:Date,endDate:Date,certificateUrl:String},
  certificates:{name:{type:String,required:true},organization:String,issueDate:Date,expiryDate:Date,fileUrl:String,credentialUrl:String},
  achievements:{title:{type:String,required:true},type:String,organization:String,date:Date,description:String,url:String},
  applications:{company:{type:String,required:true},role:{type:String,required:true},status:{type:String,default:'Applied'},appliedDate:Date,interviewDate:Date,offerStatus:String,notes:String,jobUrl:String},
  resumes:{name:{type:String,required:true},template:String,fileUrl:String,score:Number,updatedAt:Date},
  github:{repositoryUrl:{type:String,required:true},summary:String,score:Number,analysis:Schema.Types.Mixed,analyzedAt:Date},
  roadmaps:{goal:{type:String,required:true},weeks:[{title:String,tasks:[{title:String,completed:Boolean}]}],progress:Number},
  interviews:{company:String,role:String,type:String,date:Date,score:Number,feedback:String,transcript:String},
  learning:{title:{type:String,required:true},goal:String,type:String,resourceUrl:String,progress:Number,dueDate:Date,notes:String},
  calendar:{title:{type:String,required:true},type:String,date:{type:Date,required:true},endDate:Date,location:String,notes:String},
  settings:{theme:{type:String,default:'light'},timezone:String,weekStartsOn:{type:String,default:'monday'},emailReminders:{type:String,default:'Enabled'},dashboardLayout:[String]}
};
export const resourceNames=Object.keys(definitions);

function resourceSchema(fields:Record<string,unknown>){const schema=new Schema({...fields,studentId:{type:Schema.Types.ObjectId,ref:'StudentProfile',required:true,index:true}},{timestamps:true,strict:'throw'});schema.index({studentId:1,createdAt:-1});return schema;}
function compileResources(connection:Connection){return Object.fromEntries(Object.entries(definitions).map(([key,fields])=>{const modelName=key[0].toUpperCase()+key.slice(1);return [key,connection.models[modelName]||connection.model(modelName,resourceSchema(fields),key)]})) as Record<string,Model<any>>;}

// These default-connection models are retained for one-time migration of records made before
// dedicated student databases existed. New reads and writes use getTenantModels exclusively.
export const legacyResources=compileResources(mongoose.connection);
export function getTenantModels(databaseName:string){
  const connection=mongoose.connection.useDb(databaseName,{useCache:true});
  const StudentProfile=connection.models.StudentProfile||connection.model('StudentProfile',profileSchema,'students');
  const Application=connection.models.StudentApplication||connection.model('StudentApplication',studentApplicationSchema,'studentapplications');
  return {connection,StudentProfile,StudentApplication:Application,resources:compileResources(connection)};
}
