import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:telvo/config/routes.dart';
import 'package:telvo/models/professional_display.dart';
import 'package:telvo/models/user_model.dart';
import 'package:telvo/providers/user_provider.dart';
import 'package:telvo/utils/app_colors.dart';
import 'package:telvo/utils/lookup_data.dart';
import 'package:telvo/widgets/empty_state.dart';
import 'package:telvo/widgets/professional_card.dart';
import 'package:telvo/widgets/custom_text_field.dart';
import 'package:telvo/widgets/searchable_option_picker.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _minPriceController = TextEditingController();
  final TextEditingController _maxPriceController = TextEditingController();
  String _selectedCategory = 'All';
  String _selectedCity = 'All';
  String _selectedAvailabilityStatus = 'All';
  String _searchText = '';
  double _minRating = 0;
  bool _verifiedOnly = false;
  bool _availableOnly = false;

  @override
  void dispose() {
    _searchController.dispose();
    _minPriceController.dispose();
    _maxPriceController.dispose();
    super.dispose();
  }

  List<UserModel> _applyTextFilter(List<UserModel> professionals) {
    if (_searchText.trim().isEmpty) return professionals;
    final query = _searchText.trim().toLowerCase();
    return professionals.where((p) {
      final id = (p.id ?? '').toLowerCase();
      final name = (p.fullName ?? '').toLowerCase();
      final username = (p.username ?? '').toLowerCase();
      final category = (p.category ?? '').toLowerCase();
      final city = (p.city ?? '').toLowerCase();
      final neighborhood = (p.neighborhood ?? '').toLowerCase();
      return id.contains(query) ||
          name.contains(query) ||
          username.contains(query) ||
          category.contains(query) ||
          city.contains(query) ||
          neighborhood.contains(query);
    }).toList();
  }

  void _resetFilters() {
    setState(() {
      _selectedCategory = 'All';
      _selectedCity = 'All';
      _selectedAvailabilityStatus = 'All';
      _minRating = 0;
      _verifiedOnly = false;
      _availableOnly = false;
      _minPriceController.clear();
      _maxPriceController.clear();
    });
  }

  Future<void> _selectCategory() async {
    final selected = await showSearchableOptionPicker(
      context: context,
      title: 'Select Category',
      options: ['All', ...LookupData.jobCategories],
      initialValue: _selectedCategory != 'All' ? _selectedCategory : null,
    );
    if (selected != null) {
      setState(() {
        _selectedCategory = selected;
      });
    }
  }

  Future<void> _selectCity() async {
    final selected = await showSearchableOptionPicker(
      context: context,
      title: 'Select City',
      options: ['All', ...LookupData.supportedCities],
      initialValue: _selectedCity != 'All' ? _selectedCity : null,
    );
    if (selected != null) {
      setState(() {
        _selectedCity = selected;
      });
    }
  }

  Future<void> _selectAvailabilityStatus() async {
    final selected = await showSearchableOptionPicker(
      context: context,
      title: 'Select Availability',
      options: const ['All', 'Online', 'Offline'],
      initialValue: _selectedAvailabilityStatus != 'All' ? _selectedAvailabilityStatus : null,
    );
    if (selected != null) {
      setState(() {
        _selectedAvailabilityStatus = selected;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final userProvider = context.read<UserProvider>();
    final category = _selectedCategory == 'All' ? null : _selectedCategory;
    final city = _selectedCity == 'All' ? null : _selectedCity;
    final minPrice = _minPriceController.text.trim().isNotEmpty
        ? double.tryParse(_minPriceController.text.trim())
        : null;
    final maxPrice = _maxPriceController.text.trim().isNotEmpty
        ? double.tryParse(_maxPriceController.text.trim())
        : null;
    final availabilityStatus = _selectedAvailabilityStatus == 'All'
        ? null
        : _selectedAvailabilityStatus;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  Row(
                    children: [
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.arrow_back_rounded),
                      ),
                      Expanded(
                        child: CustomTextField(
                          controller: _searchController,
                          hintText: 'Search professionals...',
                          prefixIcon: const Icon(Icons.search_rounded),
                          onChanged: (value) =>
                              setState(() => _searchText = value),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap: _selectCategory,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: Theme.of(context).colorScheme.surface,
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          _selectedCategory,
                                          style: TextStyle(
                                            color: Theme.of(context).colorScheme.onSurface,
                                            fontWeight: FontWeight.w600,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const Icon(Icons.keyboard_arrow_down_rounded),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: GestureDetector(
                                onTap: _selectCity,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: Theme.of(context).colorScheme.surface,
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          _selectedCity,
                                          style: TextStyle(
                                            color: Theme.of(context).colorScheme.onSurface,
                                            fontWeight: FontWeight.w600,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const Icon(Icons.keyboard_arrow_down_rounded),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: CustomTextField(
                                controller: _minPriceController,
                                hintText: 'Min price',
                                keyboardType: TextInputType.number,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: CustomTextField(
                                controller: _maxPriceController,
                                hintText: 'Max price',
                                keyboardType: TextInputType.number,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        GestureDetector(
                          onTap: _selectAvailabilityStatus,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.surface,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    _selectedAvailabilityStatus,
                                    style: TextStyle(
                                      color: Theme.of(context).colorScheme.onSurface,
                                      fontWeight: FontWeight.w600,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const Icon(Icons.keyboard_arrow_down_rounded),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _buildFilterButton(
                              label: 'Verified Only',
                              selected: _verifiedOnly,
                              onTap: () => setState(() => _verifiedOnly = !_verifiedOnly),
                            ),
                            _buildFilterButton(
                              label: 'Available Now',
                              selected: _availableOnly,
                              onTap: () => setState(() => _availableOnly = !_availableOnly),
                            ),
                            _buildFilterButton(
                              label: '4+ Stars',
                              selected: _minRating >= 4,
                              onTap: () {
                                setState(() {
                                  _minRating = _minRating >= 4 ? 0 : 4;
                                });
                              },
                            ),
                            OutlinedButton(
                              onPressed: _resetFilters,
                              style: OutlinedButton.styleFrom(
                                side: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(24),
                                ),
                              ),
                              child: const Text('Reset Filters'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: StreamBuilder<List<UserModel>>(
                // key forces the StreamBuilder to resubscribe to a fresh
                // stream whenever the category filter changes.
                key: ValueKey([
                  category,
                  city,
                  _verifiedOnly,
                  _availableOnly,
                  _minRating,
                  minPrice,
                  maxPrice,
                  availabilityStatus,
                ]),
                stream: userProvider.getProfessionals(
                  category: category,
                  city: city,
                  minRating: _minRating > 0 ? _minRating : null,
                  minPrice: minPrice,
                  maxPrice: maxPrice,
                  availabilityStatus: availabilityStatus,
                  verifiedOnly: _verifiedOnly,
                  onlineOnly: _availableOnly,
                ),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(
                      child: CircularProgressIndicator(strokeWidth: 3),
                    );
                  }
                  if (snapshot.hasError) {
                    return const EmptyState(
                      title: 'Unable to load professionals',
                      subtitle: 'Please check your network and try again.',
                      imagePath: 'assets/images/no_connection.png',
                    );
                  }

                  final professionals = _applyTextFilter(snapshot.data ?? []);

                  if (professionals.isEmpty) {
                    return _buildEmptyState();
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 90),
                    itemCount: professionals.length,
                    itemBuilder: (context, index) {
                      final professional = professionals[index];
                      return ProfessionalCard(
                        professional: Professional(
                          name: professional.fullName ?? 'Unknown',
                          title: professional.category ?? 'Professional',
                          rating: professional.rating ?? 0,
                          jobs: professional.jobsCompleted ?? 0,
                          verified: professional.isVerified,
                          photoUrl: professional.profilePhoto,
                        ),
                        onTap: () {
                          Navigator.pushNamed(
                            context,
                            AppRoutes.professionalProfile,
                            arguments: professional,
                          );
                        },
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterButton({
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      selectedColor: AppColors.primary,
      checkmarkColor: Colors.white,
      labelStyle: TextStyle(
        color: selected ? Colors.white : Theme.of(context).colorScheme.onSurface,
        fontWeight: FontWeight.w600,
      ),
    );
  }
 
  Widget _buildEmptyState() => const EmptyState(
    title: 'No professionals found',
    subtitle: 'Try adjusting your search or filters',
    imagePath: 'assets/images/empty_state.png',
  );
}