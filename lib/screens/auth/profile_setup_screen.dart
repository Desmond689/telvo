import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:telvo/providers/auth_provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:telvo/utils/geo.dart';
import 'package:telvo/config/routes.dart';
import 'package:telvo/utils/lookup_data.dart';
import 'package:telvo/widgets/custom_button.dart';
import 'package:telvo/widgets/custom_text_field.dart';
import 'package:telvo/widgets/searchable_option_picker.dart';

class ProfileSetupScreen extends StatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  State<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends State<ProfileSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _fullNameController = TextEditingController();
  final TextEditingController _cityController = TextEditingController();
  final TextEditingController _neighborhoodController = TextEditingController();

  String? _selectedLanguage;
  String? _profilePhotoUrl;
  String? _selectedPhotoPath;
  bool _isLoading = false;
  bool _isUploadingPhoto = false;

  final List<String> _languages = ['English', 'French', 'Pidgin', 'Spanish'];

  @override
  void dispose() {
    _fullNameController.dispose();
    _cityController.dispose();
    _neighborhoodController.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final authProvider = context.read<AuthProvider>();
    final currentUser = authProvider.currentUser;

    if (_profilePhotoUrl == null) {
      _profilePhotoUrl = currentUser?.profilePhoto;
    }

    if (currentUser != null) {
      if (_fullNameController.text.isEmpty) {
        _fullNameController.text = currentUser.fullName ?? '';
      }
      if (_cityController.text.isEmpty) {
        _cityController.text = currentUser.city ?? '';
      }
      if (_neighborhoodController.text.isEmpty) {
        _neighborhoodController.text = currentUser.neighborhood ?? '';
      }
      if (_selectedLanguage == null) {
        _selectedLanguage = currentUser.language;
      }
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 85,
    );
    if (!mounted || image == null) return;

    setState(() {
      _selectedPhotoPath = image.path;
      _isUploadingPhoto = true;
    });

    final authProvider = context.read<AuthProvider>();
    final url = await authProvider.uploadProfilePhoto(image.path);

    if (!mounted) return;
    setState(() => _isUploadingPhoto = false);

    if (url != null) {
      setState(() {
        _profilePhotoUrl = url;
      });
    } else if (authProvider.error != null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(authProvider.error!)));
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedLanguage == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please select a language')));
      return;
    }

    setState(() => _isLoading = true);

    final authProvider = context.read<AuthProvider>();

    // Try to capture current device location for better matching
    double? lat;
    double? lng;
    String? geoHash;
    try {
      final permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.always ||
          permission == LocationPermission.whileInUse) {
        final pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.best,
        );
        lat = pos.latitude;
        lng = pos.longitude;
        geoHash = encodeGeoHash(lat, lng);
      }
    } catch (_) {}

    final wasCompletingProfile = authProvider.currentUser?.city?.isNotEmpty == true ||
        authProvider.currentUser?.neighborhood?.isNotEmpty == true ||
        authProvider.currentUser?.language?.isNotEmpty == true;

    await authProvider.updateProfile({
      'fullName': _fullNameController.text.trim(),
      'city': _cityController.text.trim(),
      'neighborhood': _neighborhoodController.text.trim(),
      'language': _selectedLanguage,
      'profilePhoto': _profilePhotoUrl,
      if (lat != null) 'latitude': lat,
      if (lng != null) 'longitude': lng,
      if (geoHash != null) 'geoHash': geoHash,
    });

    if (mounted) {
      setState(() => _isLoading = false);
      if (authProvider.error == null) {
        await Future<void>.delayed(Duration.zero);
        if (!mounted) return;

        final userType = authProvider.currentUser?.userType;
        if (wasCompletingProfile) {
          Navigator.pop(context);
        } else if (userType == null) {
          Navigator.pushReplacementNamed(context, AppRoutes.chooseMode);
        } else if (userType == 'professional' || userType == 'both') {
          Navigator.pushReplacementNamed(
            context,
            AppRoutes.professionalSetup,
          );
        } else {
          Navigator.pushReplacementNamed(context, AppRoutes.home);
        }
      } else {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(authProvider.error!)));
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Complete Profile'), elevation: 0),
    body: SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Let\'s complete your profile',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Help us personalize your experience',
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 32),
            Center(
              child: GestureDetector(
                onTap: _pickImage,
                child: Stack(
                  children: [
                    CircleAvatar(
                      radius: 60,
                      backgroundImage: _selectedPhotoPath != null
                          ? FileImage(File(_selectedPhotoPath!))
                                as ImageProvider
                          : (_profilePhotoUrl != null
                                ? NetworkImage(_profilePhotoUrl!)
                                : null),
                      child:
                          _selectedPhotoPath == null && _profilePhotoUrl == null
                          ? const Icon(
                              Icons.person,
                              size: 60,
                              color: Colors.grey,
                            )
                          : null,
                    ),
                    if (_isUploadingPhoto)
                      Positioned.fill(
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.35),
                            shape: BoxShape.circle,
                          ),
                          child: const Center(
                            child: CircularProgressIndicator(
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Color(0xFF00C853),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.camera_alt,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Center(
              child: TextButton(
                onPressed: _pickImage,
                child: const Text('Select Profile Photo'),
              ),
            ),
            const SizedBox(height: 24),
            CustomTextField(
              controller: _fullNameController,
              hintText: 'Full Name',
              labelText: 'Full Name',
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter your full name';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _cityController,
              readOnly: true,
              decoration: const InputDecoration(
                labelText: 'City',
                hintText: 'Select your city',
                border: OutlineInputBorder(),
              ),
              onTap: () async {
                final selected = await showSearchableOptionPicker(
                  context: context,
                  title: 'Select City',
                  options: LookupData.supportedCities,
                  initialValue: _cityController.text.isNotEmpty
                      ? _cityController.text
                      : null,
                );
                if (selected != null)
                  setState(() => _cityController.text = selected);
              },
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please select your city';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            CustomTextField(
              controller: _neighborhoodController,
              hintText: 'Neighborhood',
              labelText: 'Neighborhood',
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter your neighborhood';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _selectedLanguage,
              decoration: InputDecoration(
                labelText: 'Language',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: Colors.grey.shade50,
              ),
              items: _languages.map((lang) {
                return DropdownMenuItem(value: lang, child: Text(lang));
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedLanguage = value;
                });
              },
              validator: (value) {
                if (value == null) {
                  return 'Please select a language';
                }
                return null;
              },
            ),
            const SizedBox(height: 32),
            CustomButton(
              text: _isLoading ? 'Saving...' : 'Continue',
              onPressed: _isLoading ? null : _saveProfile,
            ),
          ],
        ),
      ),
    ),
  );
}
