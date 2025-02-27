import { findNodeHandle } from "react-native"
import { createFragmentContainer, graphql } from "react-relay"
import styled from "styled-components/native"

import { AttachmentPreview_attachment$data } from "__generated__/AttachmentPreview_attachment.graphql"
import { ClassTheme, Touchable } from "palette"
import React from "react"

const Container = styled.View`
  flex-direction: column;
  flex: 1;
  flex-grow: 1;
`

export interface AttachmentProps {
  // reactNodeHandle is passed to the native side to decide which UIView to show the
  // download progress bar on.
  onSelected?: (reactNodeHandle: number, attachmentID: string) => void
}

interface Props extends AttachmentProps {
  attachment: AttachmentPreview_attachment$data
}

export class AttachmentPreview extends React.Component<Props> {
  render() {
    const { attachment, children, onSelected } = this.props
    return (
      <ClassTheme>
        {({ color }) => (
          <Touchable
            underlayColor={color("black5")}
            onPress={() => onSelected?.(findNodeHandle(this)!, attachment.internalID)}
          >
            <Container>{children}</Container>
          </Touchable>
        )}
      </ClassTheme>
    )
  }
}

export default createFragmentContainer(AttachmentPreview, {
  attachment: graphql`
    fragment AttachmentPreview_attachment on Attachment {
      internalID
    }
  `,
})
