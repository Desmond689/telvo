import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:telvo/providers/auth_provider.dart';
import 'package:telvo/config/routes.dart';
import 'package:telvo/utils/lookup_data.dart';
import 'package:telvo/widgets/searchable_option_picker.dart';
import 'package:telvo/widgets/custom_button.dart';
import 'package:telvo/widgets/custom_text_field.dart';

class ProfessionalSetupScreen extends StatefulWidget {
  const ProfessionalSetupScreen({super.key});

  @override
  State<ProfessionalSetupScreen> createState() =>
      _ProfessionalSetupScreenState();
}

class _ProfessionalSetupScreenState extends State<ProfessionalSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _categoryController = TextEditingController();
  final TextEditingController _skillsController = TextEditingController();
  final TextEditingController _experienceController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _serviceAreaController = TextEditingController();

  final List<String> _skills = [];
  final List<String> _serviceAreas = [];
  final List<String> _portfolioPhotos = [];
  final List<String> _certificates = [];
  bool _emergencyServices = false;
  bool _isLoading = false;
  bool _isUploadingPhoto = false;


  @override
  void dispose() {
    _categoryController.dispose();
    _skillsController.dispose();
    _experienceController.dispose();
    _descriptionController.dispose();
    _serviceAreaController.dispose();
    super.dispose();
  }

  Future<void> _pickPortfolioPhoto() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 85,
    );
    if (!mounted || image == null) return;

    setState(() => _isUploadingPhoto = true);

    final authProvider = context.read<AuthProvider>();
    final url = await authProvider.uploadPortfolioPhoto(image.path);

    if (!mounted) return;
    setState(() => _isUploadingPhoto = false);

    if (url != null) {
      setState(() {
        _portfolioPhotos.add(url);
      });
    } else if (authProvider.error != null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(authProvider.error!)));
    }
  }

  Future<void> _saveProfessionalProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final authProvider = context.read<AuthProvider>();
    await authProvider.updateProfile({
      'category': _categoryController.text,
      'skills': _skills,
      'yearsOfExperience': int.tryParse(_experienceController.text) ?? 0,
      'description': _descriptionController.text,
      'serviceAreas': _serviceAreas,
      'portfolioPhotos': _portfolioPhotos,
      'certificates': _certificates,
      'emergencyServices': _emergencyServices,
      'isVerified': false, // Will be verified by admin
    });

    if (mounted) {
      setState(() => _isLoading = false);

      if (authProvider.error == null) {
        Navigator.pushReplacementNamed(
          context,
          AppRoutes.professionalDashboard,
        );
      } else {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(authProvider.error!)));
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Professional Setup'), elevation: 0),
    body: SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Tell us about your skills',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Complete your professional profile',
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 24),
            TextFormField(
              controller: _categoryController,
              readOnly: true,
              decoration: InputDecoration(
                labelText: 'Category',
                hintText: 'Select your main job',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                suffixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.grey.shade50,
              ),
              onTap: () async {
                final selected = await showSearchableOptionPicker(
                  context: context,
                  title: 'Select Category',
                  options: LookupData.jobCategories,
                  initialValue: _categoryController.text.isNotEmpty ? _categoryController.text : null,
                );
                if (selected != null) {
                  setState(() {
                    _categoryController.text = selected;
                  });
                }
              },
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please select a category';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            _buildSkillInput(),
            const SizedBox(height: 16),
            CustomTextField(
              controller: _experienceController,
              hintText: 'Years of Experience',
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter years of experience';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            CustomTextField(
              controller: _descriptionController,
              hintText: 'Description',
              maxLines: 4,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter a description';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            _buildServiceAreaInput(),
            const SizedBox(height: 16),
            _buildPortfolioSection(),
            const SizedBox(height: 16),
            SwitchListTile(
              title: const Text('Emergency Services'),
              subtitle: const Text('Available for emergency requests'),
              value: _emergencyServices,
              onChanged: (value) {
                setState(() {
                  _emergencyServices = value;
                });
              },
              activeThumbColor: const Color(0xFF00C853),
            ),
            const SizedBox(height: 24),
            CustomButton(
              text: _isLoading ? 'Saving...' : 'Complete Setup',
              onPressed: _isLoading ? null : _saveProfessionalProfile,
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    ),
  );

  Widget _buildSkillInput() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        children: [
          Expanded(
            child: CustomTextField(
              controller: _skillsController,
              hintText: 'Add a skill',
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: () {
              if (_skillsController.text.isNotEmpty) {
                setState(() {
                  _skills.add(_skillsController.text);
                  _skillsController.clear();
                });
              }
            },
            icon: const Icon(Icons.add_circle, color: Color(0xFF00C853)),
          ),
        ],
      ),
      if (_skills.isNotEmpty) ...[
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _skills.map((skill) {
            return Chip(
              label: Text(skill),
              onDeleted: () {
                setState(() {
                  _skills.remove(skill);
                });
              },
              deleteIcon: const Icon(Icons.close, size: 16),
            );
          }).toList(),
        ),
      ],
    ],
  );

  Widget _buildServiceAreaInput() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        children: [
          Expanded(
            child: CustomTextField(
              controller: _serviceAreaController,
              hintText: 'Add service area',
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: () {
              if (_serviceAreaController.text.isNotEmpty) {
                setState(() {
                  _serviceAreas.add(_serviceAreaController.text);
                  _serviceAreaController.clear();
                });
              }
            },
            icon: const Icon(Icons.add_circle, color: Color(0xFF00C853)),
          ),
        ],
      ),
      if (_serviceAreas.isNotEmpty) ...[
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _serviceAreas.map((area) {
            return Chip(
              label: Text(area),
              onDeleted: () {
                setState(() {
                  _serviceAreas.remove(area);
                });
              },
              deleteIcon: const Icon(Icons.close, size: 16),
            );
          }).toList(),
        ),
      ],
    ],
  );

  Widget _buildPortfolioSection() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const Text(
        'Portfolio Photos',
        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
      ),
      const SizedBox(height: 8),
      Row(
        children: [
          GestureDetector(
            onTap: _pickPortfolioPhoto,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: const Icon(
                Icons.add_photo_alternate,
                color: Colors.grey,
                size: 32,
              ),
            ),
          ),
          if (_portfolioPhotos.isNotEmpty) ...[
            const SizedBox(width: 8),
            Expanded(
              child: SizedBox(
                height: 80,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _portfolioPhotos.length,
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Stack(
                        children: [
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              image: DecorationImage(
                                image: NetworkImage(_portfolioPhotos[index]),
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          Positioned(
                            right: 4,
                            top: 4,
                            child: GestureDetector(
                              onTap: () {
                                setState(() {
                                  _portfolioPhotos.removeAt(index);
                                });
                              },
                              child: Container(
                                decoration: const BoxDecoration(
                                  color: Colors.red,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.close,
                                  size: 16,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
          ],
        ],
      ),
    ],
  );
}
