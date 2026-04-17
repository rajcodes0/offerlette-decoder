import mongoose from "mongoose";

const clauseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  originalText: {
    type: String,
    required: true,
  },
   plainExplanation: {  // ✅ FIXED - changed from plainExplaination
    type: String,
    required: true,
  },
riskLevel:{
    type:String,
    enum:['green','yellow','red'],
    required:true
},
riskReason:{
    type:String,
    default:null
}
});

const salaryAssessmentSchema = new mongoose.Schema({
    offeredAmount:{
        type:String,
        required:true
    },
    currency:{
        type:String,
        required:true,
        default:'USD'
    },
    marketComparison: {
    type: String,
    enum: ['below', 'market', 'above'],
    required: true
  },
  note: {
    type: String,
    default: ''
  }
})

const analysisResultSchema = new mongoose.Schema({
  clauses: [clauseSchema],
  overallRiskScore: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  salaryAssessment: {
    type: salaryAssessmentSchema,
    required: true
  },
  negotiationScript: {
    type: String,
    required: true
  },
  topRedFlags: [{
    type: String
  }]
});
const analysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null  // null means anonymous user
  },
  inputType: {
    type: String,
    enum: ['pdf', 'text'],
    required: true
  },
  rawText: {
    type: String,
    required: true
  },
  result: {
    type: analysisResultSchema,
    required: true
  }
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt
});

analysisSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Analysis', analysisSchema);
 