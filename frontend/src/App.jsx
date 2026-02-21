import { useState } from 'react'
import { Layout, List, Input, Button, Avatar, Typography, Tag, Empty, Divider } from 'antd'
import { UserOutlined, FolderOpenOutlined, PhoneOutlined, MailOutlined, HomeOutlined, GlobalOutlined } from '@ant-design/icons'
import vCard from 'vcard-parser'
import { OpenVCardFile } from '../wailsjs/go/main/App'
import 'antd/dist/reset.css'

const { Sider, Content } = Layout
const { Title, Text } = Typography

// vcard-parser retourne un objet pour UNE seule vCard
// Pour plusieurs vCards dans un fichier, on doit splitter manuellement
function splitAndParse(raw) {
  // Unfold les lignes repliées (ligne suivante commence par espace)
  const unfolded = raw.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '')

  // Extraire chaque bloc BEGIN:VCARD...END:VCARD
  const blocks = []
  const regex = /BEGIN:VCARD[\s\S]*?END:VCARD/gi
  let match
  while ((match = regex.exec(unfolded)) !== null) {
    blocks.push(match[0])
  }

  return blocks.map((block, i) => {
    try {
      const card = vCard.parse(block)

      // Helpers pour extraire proprement les valeurs
      const getStr = (field) => card[field]?.[0]?.value || ''
      const getArr = (field) => card[field] || []

      // N : [famille, prénom, additional, prefix, suffix]
      const nParts = card.n?.[0]?.value || []

      // ADR : [pobox, ext, street, city, state, zip, country]
      const addresses = getArr('adr').map(a => ({
        type: a.meta?.type?.[0] || 'Adresse',
        parts: Array.isArray(a.value) ? a.value : [a.value],
      }))

      const tels = getArr('tel').map(t => ({
        type: t.meta?.type?.[0] || 'Tel',
        value: t.value,
      }))

      const emails = getArr('email').map(e => ({
        type: e.meta?.type?.[0] || 'Email',
        value: e.value,
      }))

      return {
        id: i,
        fn: getStr('fn') || `Contact ${i + 1}`,
        firstName: nParts[1] || '',
        lastName: nParts[0] || '',
        middleName: nParts[2] || '',
        prefix: nParts[3] || '',
        suffix: nParts[4] || '',
        org: getStr('org'),
        title: getStr('title'),
        tel: tels,
        email: emails,
        adr: addresses,
        note: getStr('note'),
        url: getStr('url'),
        bday: getStr('bday'),
        gender: getStr('gender'),
        tz: getStr('tz'),
      }
    } catch (e) {
      console.error(`Erreur parsing contact ${i}:`, e)
      return { id: i, fn: `Contact ${i + 1} (erreur)`, tel: [], email: [], adr: [] }
    }
  })
}

const TYPE_COLORS = {
  home: 'blue', work: 'green', cell: 'purple',
  postal: 'orange', parcel: 'cyan', voice: 'geekblue',
}

function typeColor(type) {
  return TYPE_COLORS[type?.toLowerCase()] || 'default'
}

export default function App() {
  const [contacts, setContacts] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const handleOpen = async () => {
    setError('')
    try {
      const raw = await OpenVCardFile()
      if (!raw) return
      const parsed = splitAndParse(raw)
      setContacts(parsed)
      setSelected(parsed[0] || null)
    } catch (e) {
      setError('Erreur : ' + e.message)
      console.error(e)
    }
  }

  const filtered = contacts.filter(c =>
    c.fn.toLowerCase().includes(search.toLowerCase()) ||
    c.org?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout style={{ height: '100vh' }}>
      {/* Sidebar */}
      <Sider width={260} theme="light" style={{ borderRight: '1px solid #f0f0f0', overflow: 'auto' }}>
        <div style={{ padding: 12 }}>
          <Button
            icon={<FolderOpenOutlined />}
            onClick={handleOpen}
            block type="primary"
            style={{ marginBottom: 10 }}
          >
            Ouvrir .vcf
          </Button>
          <Input.Search
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 6 }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {filtered.length} contact{filtered.length !== 1 ? 's' : ''}
          </Text>
        </div>

        {error && <Text type="danger" style={{ padding: '0 12px', display: 'block' }}>{error}</Text>}

        {contacts.length === 0
          ? <Empty description="Aucun contact" style={{ marginTop: 40 }} />
          : (
            <List
              dataSource={filtered}
              renderItem={(c) => (
                <List.Item
                  onClick={() => setSelected(c)}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    background: selected?.id === c.id ? '#e6f4ff' : 'transparent',
                    borderLeft: selected?.id === c.id ? '3px solid #1677ff' : '3px solid transparent',
                  }}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />}
                    title={<Text strong>{c.fn}</Text>}
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {c.org || c.email[0]?.value || ''}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          )
        }
      </Sider>

      {/* Panneau de détail */}
      <Content style={{ padding: 32, overflow: 'auto', background: '#fff' }}>
        {selected
          ? <ContactDetail contact={selected} />
          : <Empty description="Ouvre un fichier .vcf et sélectionne un contact" style={{ marginTop: 100 }} />
        }
      </Content>
    </Layout>
  )
}

function ContactDetail({ contact }) {
  // Formater l'adresse depuis les parties ADR
  const formatAdr = (parts) => {
    // [pobox, ext, street, city, state, zip, country]
    const [, , street, city, state, zip, country] = parts
    return [street, city, state, zip, country].filter(Boolean).join(', ')
  }

  return (
    <div style={{ maxWidth: 650 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24 }}>
        <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#1677ff', flexShrink: 0 }} />
        <div>
          <Title level={3} style={{ margin: 0 }}>{contact.fn}</Title>
          {contact.prefix && <Tag>{contact.prefix}</Tag>}
          {contact.suffix && <Tag>{contact.suffix}</Tag>}
          {contact.org && <div><Text type="secondary">{contact.org}</Text></div>}
          {contact.title && <div><Text type="secondary">{contact.title}</Text></div>}
          {contact.gender && (
            <Tag style={{ marginTop: 4 }}>
              {contact.gender === 'M' ? '♂ Homme' : contact.gender === 'F' ? '♀ Femme' : contact.gender}
            </Tag>
          )}
        </div>
      </div>

      <Divider />

      {/* Téléphones */}
      {contact.tel.length > 0 && (
        <Section icon={<PhoneOutlined />} title="Téléphone">
          {contact.tel.map((t, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <Tag color={typeColor(t.type)}>{t.type}</Tag>
              <Text>{t.value}</Text>
            </div>
          ))}
        </Section>
      )}

      {/* Emails */}
      {contact.email.length > 0 && (
        <Section icon={<MailOutlined />} title="Email">
          {contact.email.map((e, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <Tag color={typeColor(e.type)}>{e.type}</Tag>
              <Text>{e.value}</Text>
            </div>
          ))}
        </Section>
      )}

      {/* Adresses */}
      {contact.adr.length > 0 && (
        <Section icon={<HomeOutlined />} title="Adresse">
          {contact.adr.map((a, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <Tag color={typeColor(a.type)}>{a.type}</Tag>
              <Text>{formatAdr(a.parts)}</Text>
            </div>
          ))}
        </Section>
      )}

      {/* Infos supplémentaires */}
      {(contact.bday || contact.tz || contact.url || contact.note) && (
        <>
          <Divider />
          {contact.bday && <InfoRow label="Date de naissance" value={contact.bday} />}
          {contact.tz && <InfoRow label="Fuseau horaire" value={contact.tz} />}
          {contact.url && (
            <InfoRow
              label="Site web"
              value={<a href={contact.url} target="_blank" rel="noreferrer"><GlobalOutlined /> {contact.url}</a>}
            />
          )}
          {contact.note && <InfoRow label="Note" value={contact.note} />}
        </>
      )}
    </div>
  )
}

function Section({ icon, title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <Text strong style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#555' }}>
        {icon} {title}
      </Text>
      <div style={{ paddingLeft: 20 }}>{children}</div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <Text type="secondary">{label} : </Text>
      <Text>{value}</Text>
    </div>
  )
}