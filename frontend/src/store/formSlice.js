import { createSlice } from '@reduxjs/toolkit';

// These are all the blank fields on our CRM form
const initialState = {
  hcpName: '',
  interactionDate: '',
  interactionTime: '',
  interactionType: 'Meeting',
  attendees: '',
  topicsDiscussed: '',
  materialsShared: '',
  sentiment: '',
  outcomes: '',
  followUpActions: ''
};

const formSlice = createSlice({
  name: 'form',
  initialState,
  reducers: {
    // Used by the Log Tool to fill multiple fields at once
    setFormData: (state, action) => {
      return { ...state, ...action.payload };
    },
    // Used by the Edit Tool to change just one specific field
    updateField: (state, action) => {
      const { field, value } = action.payload;
      state[field] = value;
    }
  }
});

export const { setFormData, updateField } = formSlice.actions;
export default formSlice.reducer;