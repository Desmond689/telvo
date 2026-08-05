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

  bool _filtersActive() {
    return _selectedCategory != 'All' ||
        _verifiedOnly ||
        _availableOnly ||
        _minRating > 0 ||
        _minPriceController.text.trim().isNotEmpty ||
        _maxPriceController.text.trim().isNotEmpty ||
        _selectedCity != 'All';
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

  void _openFilterSheet() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        // Temporary copy of filters
        String tempCategory = _selectedCategory;
        String tempCity = _selectedCity;
        double tempMinRating = _minRating;
        bool tempVerified = _verifiedOnly;
        bool tempAvailable = _availableOnly;
        String tempSort = 'Highest Rated';

        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Filters', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                        TextButton(
                          onPressed: () {
                            setModalState(() {
                              tempCategory = 'All';
                              tempCity = 'All';
                              tempMinRating = 0;
                              tempVerified = false;
                              tempAvailable = false;
                            });
                          },
                          child: const Text('Reset'),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Sort'),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          value: tempSort,
                          items: const [
                            DropdownMenuItem(value: 'Highest Rated', child: Text('Highest Rated')),
                            DropdownMenuItem(value: 'Fastest Response', child: Text('Fastest Response')),
                            DropdownMenuItem(value: 'Available Today', child: Text('Available Today')),
                          ],
                          onChanged: (v) => setModalState(() => tempSort = v ?? 'Highest Rated'),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Verified Only'),
                            Switch(
                              value: tempVerified,
                              onChanged: (v) => setModalState(() => tempVerified = v),
                            ),
                          ],
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Available Today'),
                            Switch(
                              value: tempAvailable,
                              onChanged: (v) => setModalState(() => tempAvailable = v),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Text('Minimum rating'),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          children: [
                            ChoiceChip(
                              label: const Text('Any'),
                              selected: tempMinRating == 0,
                              onSelected: (_) => setModalState(() => tempMinRating = 0),
                            ),
                            ChoiceChip(
                              label: const Text('3+'),
                              selected: tempMinRating == 3,
                              onSelected: (_) => setModalState(() => tempMinRating = 3),
                            ),
                            ChoiceChip(
                              label: const Text('4+'),
                              selected: tempMinRating == 4,
                              onSelected: (_) => setModalState(() => tempMinRating = 4),
                            ),
                            ChoiceChip(
                              label: const Text('4.5+'),
                              selected: tempMinRating == 4.5,
                              onSelected: (_) => setModalState(() => tempMinRating = 4.5),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              setState(() {
                                _selectedCategory = tempCategory;
                                _selectedCity = tempCity;
                                _minRating = tempMinRating;
                                _verifiedOnly = tempVerified;
                                _availableOnly = tempAvailable;
                              });
                              Navigator.pop(context);
                            },
                            child: const Text('Apply Filters'),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
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
            // Top row: back + search field + filter button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              child: Row(
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
                      onChanged: (value) => setState(() => _searchText = value),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    tooltip: 'Filters',
                    onPressed: _openFilterSheet,
                    icon: const Icon(Icons.tune_rounded),
                  ),
                ],
              ),
            ),

            // Category chips row (single-line horizontal scroll)
            SizedBox(
              height: 56,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                scrollDirection: Axis.horizontal,
                itemCount: LookupData.jobCategories.length + 1,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final isAll = index == 0;
                  final name = isAll ? 'All' : LookupData.jobCategories[index - 1];
                  final selected = _selectedCategory == name || (_selectedCategory == 'All' && name == 'All');
                  return ChoiceChip(
                    label: Text(name),
                    selected: selected,
                    onSelected: (_) {
                      setState(() {
                        _selectedCategory = name;
                      });
                    },
                    selectedColor: Theme.of(context).colorScheme.primary,
                    labelStyle: TextStyle(
                      color: selected ? Colors.white : Theme.of(context).colorScheme.onSurface,
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 8),

            // Active filter pills
            if (_filtersActive())
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      if (_selectedCategory != 'All')
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: InputChip(
                            label: Text(_selectedCategory),
                            onDeleted: () => setState(() => _selectedCategory = 'All'),
                          ),
                        ),
                      if (_verifiedOnly)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: InputChip(
                            label: const Text('Verified'),
                            onDeleted: () => setState(() => _verifiedOnly = false),
                          ),
                        ),
                      if (_availableOnly)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: InputChip(
                            label: const Text('Available Today'),
                            onDeleted: () => setState(() => _availableOnly = false),
                          ),
                        ),
                      if (_minRating > 0)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: InputChip(
                            label: Text('${_minRating.toString()}+ Stars'),
                            onDeleted: () => setState(() => _minRating = 0),
                          ),
                        ),
                      TextButton(
                        onPressed: _resetFilters,
                        child: const Text('Clear all'),
                      ),
                    ],
                  ),
                ),
              ),

            const SizedBox(height: 8),
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
                    // Check connectivity before showing offline artwork.
                    return FutureBuilder<bool>(
                      future: Helpers.checkInternetConnection(),
                      builder: (context, connSnap) {
                        if (connSnap.connectionState == ConnectionState.waiting) {
                          return const Center(child: CircularProgressIndicator());
                        }
                        final isOffline = connSnap.data != true;
                        if (isOffline) {
                          return EmptyState(
                            title: 'No Internet Connection',
                            subtitle: 'Connect to the internet to refresh available professionals.',
                            imagePath: 'assets/images/no_connection.png',
                            onAction: () => setState(() {}),
                            actionText: 'Retry',
                          );
                        }
                        // Some other error (parsing, permission, rules) — show generic message and retry.
                        return EmptyState(
                          title: 'Something went wrong',
                          subtitle: 'Please try again',
                          imagePath: 'assets/images/empty_state.png',
                          onAction: () => setState(() {}),
                          actionText: 'Retry',
                        );
                      },
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