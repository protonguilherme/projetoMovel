import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

// Import do tipo Client do database
import { Client } from '../../backend/database';

interface ClientSelectorProps {
  clients: Client[];
  selectedClient: Client | null;
  onClientSelect: (client: Client) => void;
  visible: boolean;
  onClose: () => void;
}

// Componente ClientSelector
export const ClientSelector: React.FC<ClientSelectorProps> = ({
  clients,
  selectedClient,
  onClientSelect,
  visible,
  onClose,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.clientModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Cliente</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.clientList}>
            {clients.length === 0 ? (
              <View style={styles.noClientsContainer}>
                <Text style={styles.noClientsText}>Nenhum cliente cadastrado</Text>
                <Text style={styles.noClientsSubtext}>
                  Cadastre um cliente primeiro na seção Clientes
                </Text>
              </View>
            ) : (
              clients.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={[
                    styles.clientItem,
                    selectedClient?.id === client.id && styles.clientItemSelected,
                  ]}
                  onPress={() => {
                    onClientSelect(client);
                    onClose();
                  }}
                >
                  <Text style={styles.clientName}>{client.name}</Text>
                  {client.phone && (
                    <Text style={styles.clientPhone}>
                      {client.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                    </Text>
                  )}
                  {client.email && (
                    <Text style={styles.clientEmail}>{client.email}</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Export default também para compatibilidade
export default ClientSelector;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  clientModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#999',
    padding: 5,
    fontWeight: 'bold',
  },
  clientList: {
    maxHeight: 400,
  },
  clientItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  clientItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  clientPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 13,
    color: '#888',
  },
  noClientsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noClientsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  noClientsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});