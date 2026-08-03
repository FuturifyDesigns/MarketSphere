import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config.dart';
import '../../services/data_repository.dart';
import '../../utils/app_feedback.dart';
import '../../utils/helpers.dart';
import '../../utils/page_transitions.dart';
import 'my_enquiries_screen.dart';

Future<void> showSendEnquirySheet(
  BuildContext context, {
  required String providerId,
  required String providerName,
}) async {
  final subject = TextEditingController();
  final message = TextEditingController();
  final formKey = GlobalKey<FormState>();
  var sending = false;
  String? error;

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: const Color(0xFF161B22),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
    ),
    builder: (sheetContext) {
      return StatefulBuilder(
        builder: (context, setModalState) {
          final bottom = MediaQuery.viewInsetsOf(context).bottom;
          return Padding(
            padding: EdgeInsets.fromLTRB(20, 16, 20, 20 + bottom),
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 42,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.white24,
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Send enquiry',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'To $providerName — delivered in-app like the website dashboard.',
                    style: const TextStyle(color: Color(AppConfig.colorMuted), height: 1.35),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: subject,
                    textCapitalization: TextCapitalization.sentences,
                    autovalidateMode: AutovalidateMode.onUserInteraction,
                    decoration: const InputDecoration(labelText: 'Subject'),
                    validator: validateEnquirySubject,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: message,
                    minLines: 4,
                    maxLines: 6,
                    textCapitalization: TextCapitalization.sentences,
                    autovalidateMode: AutovalidateMode.onUserInteraction,
                    decoration: const InputDecoration(labelText: 'Message'),
                    validator: validateEnquiryMessage,
                  ),
                  if (error != null) ...[
                    const SizedBox(height: 10),
                    Text(error!, style: const TextStyle(color: Color(0xFFFF8A80))),
                  ],
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: sending
                        ? null
                        : () async {
                            if (!(formKey.currentState?.validate() ?? false)) return;
                            setModalState(() {
                              sending = true;
                              error = null;
                            });
                            final err = await context.read<DataRepository>().submitEnquiry(
                                  providerId: providerId,
                                  subject: subject.text,
                                  message: message.text,
                                );
                            if (!sheetContext.mounted) return;
                            setModalState(() => sending = false);
                            if (err != null) {
                              setModalState(() => error = err);
                              return;
                            }
                            Navigator.pop(sheetContext);
                            if (!context.mounted) return;
                            showSuccessPopup(context, 'Enquiry sent — provider notified');
                            pushFade(context, const MyEnquiriesScreen());
                          },
                    child: Text(sending ? 'Sending…' : 'Send enquiry'),
                  ),
                ],
              ),
            ),
          );
        },
      );
    },
  );

  subject.dispose();
  message.dispose();
}
