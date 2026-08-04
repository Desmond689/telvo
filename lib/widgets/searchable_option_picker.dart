import 'package:flutter/material.dart';

Future<String?> showSearchableOptionPicker({
  required BuildContext context,
  required String title,
  required List<String> options,
  String? initialValue,
}) async {
  final searchController = TextEditingController(text: initialValue ?? '');

  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (sheetContext) {
      return Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 16,
        ),
        child: StatefulBuilder(
          builder: (builderContext, setState) {
            final query = searchController.text.trim().toLowerCase();
            final filteredOptions = options.where((option) {
              final optionText = option.toLowerCase();
              return query.isEmpty || optionText.contains(query);
            }).toList();

            return SizedBox(
              height: MediaQuery.of(builderContext).size.height * 0.7,
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(builderContext),
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: searchController,
                    autofocus: true,
                    decoration: InputDecoration(
                      hintText: 'Search here...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      filled: true,
                      fillColor: Theme.of(builderContext).colorScheme.surfaceContainerHighest,
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: filteredOptions.isEmpty
                        ? const Center(
                            child: Text('No matches found'),
                          )
                        : ListView.separated(
                            itemCount: filteredOptions.length,
                            separatorBuilder: (_, __) => const Divider(height: 1),
                            itemBuilder: (context, index) {
                              final option = filteredOptions[index];
                              final isSelected = initialValue == option;
                              return ListTile(
                                title: Text(option),
                                trailing: isSelected
                                    ? const Icon(Icons.check, color: Color(0xFF00C853))
                                    : null,
                                onTap: () => Navigator.pop(builderContext, option),
                              );
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        ),
      );
    },
  );
}
