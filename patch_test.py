with open("apps/web/lib/actions/user.test.ts", "r") as f:
    content = f.read()

import re
content = re.sub(
    r"it\('should return errors if validation fails \(name too short\)', async \(\) => \{\n.*?name: \['Required'\],\n.*?'Gagal memperbarui profil\. Mohon periksa input Anda\.',\n    \}\)\n  \}\)",
    """it('should return errors if validation fails (name too short)', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any)

    const formData = new FormData()
    formData.append('name', 'a')

    const result = await updateProfileAction({}, formData)

    expect(result).toMatchObject({
      errors: {
        name: ['Nama minimal 2 karakter'],
      },
      message: 'Gagal memperbarui profil. Mohon periksa input Anda.',
    })
  })""",
    content,
    flags=re.DOTALL
)

with open("apps/web/lib/actions/user.test.ts", "w") as f:
    f.write(content)
