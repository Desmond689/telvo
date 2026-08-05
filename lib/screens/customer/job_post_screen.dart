// lib/screens/customer/job_post_screen.dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:telvo/models/job_model.dart';
import 'package:telvo/providers/auth_provider.dart';
import 'package:telvo/providers/job_provider.dart';
import 'package:telvo/services/storage_service.dart';
import 'package:telvo/utils/app_colors.dart';
import 'package:telvo/utils/error_messages.dart';
import 'package:telvo/utils/geo.dart';
import 'package:telvo/utils/lookup_data.dart';
import 'package:geolocator/geolocator.dart';
import 'package:telvo/widgets/custom_button.dart';
import 'package:telvo/widgets/custom_text_field.dart';
import 'package:telvo/widgets/searchable_option_picker.dart';

class JobPostScreen extends StatefulWidget {
  const JobPostScreen({super.key});

  @override
  State<JobPostScreen> createState() => _JobPostScreenState();
}

class _JobPostScreenState extends State<JobPostScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _budgetController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();

  String? _selectedProfessionalId;
  String? _selectedBusinessId;
  String? _selectedCategory;
  String? _selectedUrgency;
  List<XFile> _selectedImages = [];
  final ImagePicker _picker = ImagePicker();
  final StorageService _storageService = StorageService();
  bool _isPosting = false;

  final List<String> _categories = LookupData.jobCategories;

  final List<String> _urgencyOptions = [
    'Emergency',
    'Today',
    'Tomorrow',
    'Flexible',
  ];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is String) {
      _selectedProfessionalId = args;
    } else if (args is JobPostArguments) {
      _selectedProfessionalId = args.professionalId;
      _selectedBusinessId = args.businessId;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Post a Job')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_selectedProfessionalId != null ||
                  _selectedBusinessId != null)
                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.primaryBackground,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.primary.withOpacity(0.2),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.info_outline_rounded,
                        color: AppColors.primary,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _selectedBusinessId != null
                              ? 'This request will be sent to the selected business.'
                              : 'This request will be sent to the selected professional.',
                          style: const TextStyle(
                            fontSize: 13,
                            fontFamily: 'Poppins',
                            color: AppColors.primaryDark,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              // What service do you need?
              const Text(
                'What service do you need?',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins',
                ),
              ),
              const SizedBox(height: 12),
              _buildCategorySelector(),
              const SizedBox(height: 20),
              // Describe the problem
              const Text(
                'Describe the problem',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins',
                ),
              ),
              const SizedBox(height: 12),
              CustomTextField(
                controller: _descriptionController,
                hintText: 'Describe your problem in detail...',
                maxLines: 4,
                validator: (value) => (value == null || value.trim().isEmpty)
                    ? 'Please describe the problem'
                    : null,
              ),
              const SizedBox(height: 20),
              // Photo upload section - prominent
              const Text(
                'Add Photos',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins',
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Show the problem - it helps professionals understand the job better',
                style: TextStyle(
                  fontSize: 13,
                  fontFamily: 'Poppins',
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                ),
              ),
              const SizedBox(height: 12),
              _buildImagePicker(),
              const SizedBox(height: 20),
              // Budget
              const Text(
                'Budget',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins',
                ),
              ),
              const SizedBox(height: 12),
              CustomTextField(
                controller: _budgetController,
                hintText: 'e.g. 25000',
                labelText: 'Budget (XAF)',
                keyboardType: TextInputType.number,
                prefixIcon: const Icon(Icons.account_balance_wallet_rounded),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter a budget';
                  }
                  if (double.tryParse(value) == null ||
                      double.parse(value) <= 0) {
                    return 'Budget must be a positive number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),
              // Address / Location
              const Text(
                'Location',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins',
                ),
              ),
              const SizedBox(height: 12),
              CustomTextField(
                controller: _addressController,
                hintText: 'Enter your address or describe your location',
                labelText: 'Address / Location',
                prefixIcon: const Icon(Icons.location_on_outlined),
                validator: (value) => (value == null || value.trim().isEmpty)
                    ? 'Please enter an address or location'
                    : null,
              ),
              const SizedBox(height: 20),
              // Urgency
              const Text(
                'Urgency',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins',
                ),
              ),
              const SizedBox(height: 12),
              _buildUrgencySelector(),
              const SizedBox(height: 28),
              CustomButton(
                text: 'Post Job',
                icon: Icons.send_rounded,
                isLoading: _isPosting,
                onPressed: _isPosting ? null : _postJob,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCategorySelector() => SizedBox(
    height: 56,
    child: Row(
      children: [
        Expanded(
          child: GestureDetector(
            onTap: () async {
              final selected = await showSearchableOptionPicker(
                context: context,
                title: 'Select service',
                options: _categories,
                initialValue: _selectedCategory,
              );
              if (selected != null) {
                setState(() => _selectedCategory = selected);
              }
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              decoration: BoxDecoration(
                color: AppColors.surfaceMuted,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _selectedCategory != null
                      ? AppColors.primary.withOpacity(0.4)
                      : Colors.transparent,
                ),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.category_outlined,
                    color: AppColors.textSecondary,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _selectedCategory ?? 'Select category',
                      style: TextStyle(
                        color: _selectedCategory == null
                            ? AppColors.textHint
                            : Theme.of(context).colorScheme.onSurface,
                        fontSize: 14,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ),
                  const Icon(
                    Icons.arrow_drop_down_rounded,
                    color: AppColors.textSecondary,
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    ),
  );

  Widget _buildImagePicker() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      // Large prominent upload button
      GestureDetector(
        onTap: _pickImages,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 24),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.3),
              width: 1.5,
              style: BorderStyle.solid,
            ),
          ),
          child: Column(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.add_a_photo_rounded,
                  color: AppColors.primary,
                  size: 28,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Take or Upload Photos',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins',
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Tap to add photos (up to 10)',
                style: TextStyle(
                  fontSize: 12,
                  fontFamily: 'Poppins',
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                ),
              ),
            ],
          ),
        ),
      ),
      if (_selectedImages.isNotEmpty) ...[
        const SizedBox(height: 12),
        SizedBox(
          height: 100,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: _selectedImages.length,
            itemBuilder: (context, index) {
              return Padding(
                padding: const EdgeInsets.only(right: 10),
                child: Stack(
                  children: [
                    Container(
                      width: 96,
                      height: 96,
                      clipBehavior: Clip.antiAlias,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: Theme.of(context).colorScheme.outlineVariant,
                        ),
                      ),
                      child: Image.file(
                        File(_selectedImages[index].path),
                        fit: BoxFit.cover,
                      ),
                    ),
                    Positioned(
                      right: 4,
                      top: 4,
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedImages.removeAt(index);
                          });
                        },
                        child: Container(
                          decoration: const BoxDecoration(
                            color: Colors.black87,
                            shape: BoxShape.circle,
                          ),
                          child: const Padding(
                            padding: EdgeInsets.all(4),
                            child: Icon(
                              Icons.close_rounded,
                              size: 14,
                              color: Colors.white,
                            ),
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
      ],
    ],
  );

  Widget _buildUrgencySelector() => Row(
    children: _urgencyOptions.map((urgency) {
      final isSelected = _selectedUrgency == urgency;
      return Expanded(
        child: Padding(
          padding: const EdgeInsets.only(right: 8),
          child: FilterChip(
            label: Text(
              urgency,
              style: TextStyle(
                fontSize: 12,
                color: isSelected
                    ? Colors.white
                    : Theme.of(context).colorScheme.onSurface,
              ),
            ),
            selected: isSelected,
            onSelected: (selected) {
              setState(() {
                _selectedUrgency = selected ? urgency : null;
              });
            },
            selectedColor: urgency == 'Emergency'
                ? AppColors.error
                : AppColors.primary,
            checkmarkColor: Colors.white,
            showCheckmark: false,
          ),
        ),
      );
    }).toList(),
  );

  Future<void> _pickImages() async {
    final images = await _picker.pickMultiImage(
      imageQuality: 85,
      maxWidth: 1600,
      maxHeight: 1600,
    );
    if (images != null) {
      setState(() {
        _selectedImages = images.take(10).toList();
      });
    }
  }

  Future<void> _postJob() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategory == null) {
      _showError('Please select a service category.');
      return;
    }
    if (_selectedUrgency == null) {
      _showError('Please select an urgency level.');
      return;
    }

    final authProvider = context.read<AuthProvider>();
    final customerId = authProvider.currentUser?.id;
    if (customerId == null) {
      _showError('You must be signed in to post a job.');
      return;
    }

    setState(() => _isPosting = true);

    try {
      final jobProvider = context.read<JobProvider>();

      // Create the job first so we have an ID to namespace uploaded photos.
      var job = JobModel(
        customerId: customerId,
        professionalId: _selectedProfessionalId,
        businessId: _selectedBusinessId,
        category: _selectedCategory,
        description: _descriptionController.text.trim(),
        budget: double.tryParse(_budgetController.text.trim()),
        address: _addressController.text.trim(),
        urgency: _selectedUrgency,
        isEmergency: _selectedUrgency == 'Emergency',
        createdAt: DateTime.now(),
        status: 'posted',
      );

      // Attempt to attach current location to the job for proximity matching
      try {
        final permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.always ||
            permission == LocationPermission.whileInUse) {
          final pos = await Geolocator.getCurrentPosition(
            locationSettings: const LocationSettings(
              accuracy: LocationAccuracy.best,
            ),
          );
          job = job.copyWith(
            latitude: pos.latitude,
            longitude: pos.longitude,
            geoHash: encodeGeoHash(pos.latitude, pos.longitude),
          );
        }
      } catch (_) {}

      final createdJob = await jobProvider.postJob(job);

      if (jobProvider.error != null || createdJob == null) {
        throw Exception(jobProvider.error ?? 'Could not create job');
      }

      if (createdJob.id != null && _selectedImages.isNotEmpty) {
        try {
          final photoUrls = await _storageService.uploadJobPhotos(
            createdJob.id!,
            _selectedImages,
          );
          if (photoUrls.isNotEmpty) {
            await jobProvider.updateJobPhotos(createdJob.id!, photoUrls);
          } else {
            // No photos uploaded successfully
            if (mounted) _showError('Job posted, but photo upload failed. You can add photos later.');
          }
        } catch (e) {
          // Don't block job creation — surface a clear error to the user
          if (mounted) _showError('Job posted, but photos failed: ${getFriendlyErrorMessage(e)}');
        }
      }

      if (!mounted) return;
      setState(() => _isPosting = false);

      await showDialog(
        context: context,
        builder: (dialogContext) => Dialog(
          backgroundColor: Theme.of(context).colorScheme.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(32),
          ),
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: AppColors.successGradient,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.success.withValues(alpha: 0.3),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.check_rounded,
                    size: 48,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Job Posted!',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Poppins',
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Your job has been posted successfully.\nNearby professionals will be notified.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    fontFamily: 'Poppins',
                    height: 1.5,
                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: CustomButton(
                    text: 'Done',
                    onPressed: () {
                      final navigator = Navigator.of(dialogContext);
                      navigator.pop();
                      navigator.pop();
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isPosting = false);
      _showError(getFriendlyErrorMessage(e));
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

class JobPostArguments {
  final String? professionalId;
  final String? businessId;

  JobPostArguments({this.professionalId, this.businessId});
}