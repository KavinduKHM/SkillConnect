import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Profile, UpdateProfileInput } from '../../types';

// ✅ Define the props explicitly
interface ProfileFormProps {
  initialData: Profile | undefined;  // ✅ Explicitly allow undefined
  onSubmit: (data: UpdateProfileInput) => void;
  loading?: boolean;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialData,  // ✅ Now accepts Profile | undefined
  onSubmit,
  loading = false,
}) => {
  const [bio, setBio] = useState(initialData?.bio || '');
  const [skills, setSkills] = useState(initialData?.skills?.join(', ') || '');
  const [experience, setExperience] = useState(initialData?.experience || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [website, setWebsite] = useState(initialData?.website || '');
  const [linkedin, setLinkedin] = useState(initialData?.socialLinks?.linkedin || '');
  const [github, setGithub] = useState(initialData?.socialLinks?.github || '');

  const handleSubmit = () => {
    const data: UpdateProfileInput = {
      bio,
      skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      experience,
      location,
      website,
      socialLinks: {
        linkedin,
        github,
      },
    };
    onSubmit(data);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Professional Information</Text>

      <Input
        label="Bio"
        placeholder="Tell us about yourself"
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={4}
        style={styles.textArea}
      />

      <Input
        label="Skills"
        placeholder="JavaScript, React, Python (comma separated)"
        value={skills}
        onChangeText={setSkills}
      />

      <Input
        label="Experience"
        placeholder="e.g., 5 years as a Full Stack Developer"
        value={experience}
        onChangeText={setExperience}
      />

      <Text style={styles.sectionTitle}>Location & Links</Text>

      <Input
        label="Location"
        placeholder="e.g., Colombo, Sri Lanka"
        value={location}
        onChangeText={setLocation}
      />

      <Input
        label="Website"
        placeholder="https://yourwebsite.com"
        value={website}
        onChangeText={setWebsite}
      />

      <Input
        label="LinkedIn"
        placeholder="https://linkedin.com/in/yourprofile"
        value={linkedin}
        onChangeText={setLinkedin}
      />

      <Input
        label="GitHub"
        placeholder="https://github.com/yourusername"
        value={github}
        onChangeText={setGithub}
      />

      <Button
        title={initialData ? 'Update Profile' : 'Create Profile'}
        onPress={handleSubmit}
        loading={loading}
        style={styles.submitButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 40,
  },
});